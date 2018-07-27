'use strict';

const ME = 'clever1';

const count = (card, cards) => cards.filter(c => c === card).length;

const cardFor = action => ({
	'taking-3': 'duke',
	'assassination': 'assassin',
	'stealing': 'captain',
	'swapping': 'ambassador',
	}[action]);

const blockersFor = action => ({
	'assassination': ['contessa'],
	'stealing': ['captain', 'ambassador'],
	'foreign-aid': ['duke']
	}[action] || []);

const reformatHistory = (history) => {
	const newHistory = [];
	let currentTurn = [];
	history.forEach(record => {
		if (record.type === 'action' && currentTurn.length > 0) {
			newHistory.push(currentTurn);
			currentTurn = []
		}
		currentTurn.push(record);
	});
	return newHistory
};

const hasPlayerBlocked = (history, action, from) => {
	return history.some(turn =>
		 (turn.find(record => record.type === 'action' && record.action === action) &&
 			turn.find(record => record.type === 'counter-action' && record.counterer !== ME && (from === undefined || record.counterer === from)))
	);
}

const safeish = (history, visibleCards, action, against) => {
	return blockersFor(action).every(c => count(c, visibleCards) === 3) || !hasPlayerBlocked(history, action, against);
}

const sortCards = (cards) => {
	const order = {
		'duke': 0,
		'captain': 1,
		'contessa': 2,
		'ambassador': 3,
		'assassin': 4,
	}
	const inverseOrder = Object.entries(order).reduce((o, [k, v]) => ({...o, [v]: k}), {});
	return cards.map(c => order[c]).sort().map(x => inverseOrder[x]);
}

const findTargets = players => players.map(p => [p.coins * p.cards, p]).sort((a, b) => b[0] - a[0]).map(x=>x[1]);

const sum = (xs) => xs.reduce((t, x) => t + x, 0);

class BOT {

	initStats(otherPlayers, myCards) {
		// console.info(otherPlayers);
		console.info(myCards);
		const CS = ['duke', 'captain', 'contessa', 'ambassador', 'assassin'];
		const xs = CS.map(c => 3 - count(c, myCards));

		const startingStats = {};
		for (let i = 0; i < 5; i++) {
			startingStats[[CS[i], CS[i]]] = xs[i]*(xs[i] - 1)/(13 * 12);
			for (let j = i+1; j < 5; j++) {
				startingStats[[CS[i], CS[j]]] = 2*xs[i]*xs[j]/(13 * 12);
			}
		}
		const stats = otherPlayers.reduce((s, p) => ({ ...s, [p.name]: {...startingStats} }), {});
		console.info(stats);
		// console.info(  sum(Object.values(Object.values(stats)[0])) );

		const deckStats = {};
		for (let i = 0; i < 5; i++) {
			// a, a-1, a-2
			deckStats[[CS[i],CS[i],CS[i]]] = xs[i] > 2 ? xs[i]*(xs[i] - 1)*(xs[i] - 2)/(13 * 12 * 11) : 0
			// a, a-1, c
			for (let k=i+1; k < 5; k++) {
				deckStats[[CS[i],CS[i],CS[k]]] = xs[i] > 1 ? 3*xs[i]*(xs[i] - 1)*xs[k]/(13 * 12 * 11) : 0;
			}
			for (let j = i+1; j< 5; j++) {
				// 2 * a, b, b-1
				deckStats[[CS[i],CS[j],CS[j]]] = xs[j] > 1 ? 3*xs[i]*(xs[j] - 1)*xs[j]/(13 * 12 * 11) : 0;
				for (let k = j+1; k < 5; k++) {
					// 6 * (a, b, c)
					deckStats[[CS[i],CS[j],CS[k]]] = 6*xs[i]*xs[j]*xs[k]/(13 * 12 * 11);
				}
			}
		}
		console.info(deckStats);
		console.info(sum(Object.values(deckStats)));
		return stats;
	}

	OnTurn({ history, myCards, myCoins, otherPlayers, discardedCards }) {

		this.stats = this.stats || this.initStats(otherPlayers, myCards);

		const targets = findTargets(otherPlayers);
		let target = targets[0];
		const visibleCards = [...myCards, ...discardedCards];
		history = reformatHistory(history);

		let action;
		if (myCards.includes(cardFor('assassination')) && myCoins >= 3 && safeish(history, visibleCards, 'assassination', target.name)) {
			action = 'assassination';
		} else if( myCoins >= 7 ) {
			action = 'couping';
		} else if (myCards.includes(cardFor('taking-3'))) {
			action = 'taking-3';
		} else if (myCards.includes(cardFor('swapping'))) {
			action = 'swapping';
		} else if (myCards.includes(cardFor('stealing')) && safeish(history, visibleCards, 'stealing', target.name) && target.coins >= 2) {
			action = 'stealing';
		} else if (safeish(history, visibleCards, 'foreign-aid')) {
			action = 'foreign-aid';
		} else {
			action = 'taking-1';
		}

		return {
			action,
			against: target.name,
		};
	}

	OnChallengeActionRound({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom}) {
		// If they're obviously bullshitting, call them
		return count(cardFor(action), [...myCards, ...discardedCards]) === 3;
	}

	OnCounterAction({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom }) {
		// If we can counter this, then do counter this.
		const match = blockersFor(action).find(c => myCards.includes(c));
		if (match) {
			return match;
		}

		// If we're gonna be dead, fight it!
		if (action === 'assassination' && myCards.length === 1) {
			return 'contessa';
		}
		return false;
	}

	OnCounterActionRound({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom, card }) {
		// If they're obviously bullshitting, call them
		return count(card, [...myCards, ...discardedCards]) === 3;
	}

	OnSwappingCards({ history, myCards, myCoins, otherPlayers, discardedCards, newCards }) {
		// Pick the best two non-identical cards
		const sorted = sortCards([...myCards, ...newCards]);
		const first = sorted[0];
		return myCards.length === 1 ? [first] : [first, sorted.find(c => c !== first) || first];
	}

	OnCardLoss({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		return sortCards([...myCards]).slice(-1)[0];
	}
}


module.exports = exports = BOT;
