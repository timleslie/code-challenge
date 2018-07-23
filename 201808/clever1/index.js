'use strict';

const ME = 'clever1';

const count = (card, cards) => cards.filter(c => c === card).length;

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
 			turn.find(record => record.type === 'counter-action' && record.from !== ME && (from === undefined || record.from === from)))
	);
}

const safeish = (history, visibleCards, action, blockers, against) => {
	return blockers.every(c => count(c, visibleCards) === 3) || !hasPlayerBlocked(history, action, against);
}

const sortCards = (cards) => {
	const order = {
		'captain': 0,
		'contessa': 1,
		'assassin': 2,
		'duke': 3,
		'ambassador': 4
	}
	const inverseOrder = Object.entries(order).reduce((o, [k, v]) => ({...o, [v]: k}), {});
	return cards.map(c => order[c]).sort().map(x => inverseOrder[x]);
}

const findTarget = (otherPlayers) => {
	return otherPlayers.map(p => [p.coins * p.cards, p]).sort((a, b) => a[0] - b[0]).slice(-1)[0][1];
}

const usefulAsBlocker = (card, visibleCards) => {
	if (card === 'duke') { return true; }
	else if (card === 'assassin') { return false; }
	else if (card === 'contessa') { return count('assassin', visibleCards) !== 3; }
	else if (['captain', 'ambassador'].includes(card)) { return count('captain', visibleCards) !== 3; }
}

const usefulAsAttacker = (card, visibleCards, history, otherPlayers) => {
	if (['duke', 'ambassador'].includes(card)) { return true; }
	else if (card === 'contessa') { return false; }
	else if (card === 'captain') {
		return ['ambassador', 'captain'].every(c => count(c, visibleCards) === 3) ||
		!(otherPlayers.every(p => hasPlayerBlocked(history, 'stealing', p.name)))  // Has everyone blocked?
	}
	else if (card === 'assassin') {
		return count('contessa', visibleCards) === 3 ||
		!(otherPlayers.every(p => hasPlayerBlocked(history, 'assassinate', p.name)))  // Has everyone blocked?
	}
}

class BOT {
	OnTurn({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		const target = findTarget(otherPlayers);
		const visibleCards = [...myCards, ...discardedCards];
		history = reformatHistory(history);

		let action;
		if (myCards.includes('assassin') && myCoins >= 3 && safeish(history, visibleCards, 'assassination', ['contessa'], target.name)) {
			action = 'assassination';
		} else if( myCoins >= 7 ) {
			action = 'couping';
		} else if (myCards.includes('duke')) {
			action = 'taking-3';
		} else if (myCards.includes('ambassador')) {
			action = 'swapping';
		} else if (myCards.includes('captain') && safeish(history, visibleCards, 'stealing', ['captain', 'ambassador'], target.name) && target.coins >= 2) {
			action = 'stealing';
		} else if (safeish(history, visibleCards, 'foreign-aid', ['duke'])) {
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
		const visibleCards = [...myCards, ...discardedCards];
		const card = {
			'taking-3': 'duke',
			'assassination': 'assassin',
			'stealing': 'captain',
			'swapping': 'ambassador',
		}[action];
		return card && count(card, visibleCards) === 3;
	}

	OnCounterAction({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom }) {
		// If we can counter this, then do counter this.
		const cards = {
			'foreign-aid': ['duke'],
			'assassination': ['contessa'],
			'stealing': ['captain', 'ambassador'],
		}[action];
		const match = cards && cards.find(c => myCards.includes(c));
		return match || false;
	}

	OnCounterActionRound({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom, card }) {
		// If they're obviously bullshitting, call them
		const visibleCards = [...myCards, ...discardedCards];
		return count(card, visibleCards) === 3;
	}

	OnSwappingCards({ history, myCards, myCoins, otherPlayers, discardedCards, newCards }) {
		// Pick the best two non-identical cards
		const sorted = sortCards([...myCards, ...newCards]);
		const first = sorted[0];
		return myCards.length === 1 ? [first] : [first, sorted.find(c => c !== first) || first];
	}

	OnCardLoss({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		// No choice, don't muck about!
		if (myCards.length === 1 || myCards[0] === myCards[1]) {
			return myCards[0];
		}
		// Choose the card with the lowest current value
		const visibleCards = [...myCards, ...discardedCards];
		history = reformatHistory(history);
		const ratings = myCards.map(c => [usefulAsBlocker(c, visibleCards), usefulAsAttacker(c, visibleCards, history, otherPlayers)].filter(x => x).length);
		return (ratings[0] < ratings[1]) ? myCards[0] : myCards[1];
	}
}


module.exports = exports = BOT;
