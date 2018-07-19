'use strict';

const {
	ALLPLAYER,
	CARDS,
	DECK,
	ACTIONS,
} = require('../constants.js');

const count = (card, visible) => visible.filter(c => c === card).length;

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

const ME = 'clever1'

const hasPlayerBlocked = (history, action, from) => {
	return history.some(turn =>
		 (turn.find(record => record.type === 'action' && record.action === action) &&
 			turn.find(record => record.type === 'counter-action' && record.from !== ME && (from === undefined || record.from === from)))
	);
}

const safeish = (history, visibleCards, action, blockers, against) => {
	return blockers.every(c => count(c, visibleCards) === 3) || !hasPlayerBlocked(history, action, against);
}

class BOT {
	OnTurn({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		const against = otherPlayers[ Math.floor( Math.random() * otherPlayers.length ) ].name;
		const scores = otherPlayers.map(p => [p.coins * p.cards, p])
		const visibleCards = [...myCards, ...discardedCards];
		history = reformatHistory(history);

		let action;
		if (myCards.includes('assassin') && myCoins >= 3 && safeish(history, visibleCards, 'assassination', ['contessa'], against)) {
			action = 'assassination';
		} else if( myCoins >= 7 ) {
			action = 'couping';
		} else if (myCards.includes('duke')) {
			action = 'taking-3';
		} else if (myCards.includes('ambassador')) {
			action = 'swapping';
		} else if (myCards.includes('captain') && safeish(history, visibleCards, 'stealing', ['captain', 'ambassador'], against)) {
			action = 'stealing';
		} else if (safeish(history, visibleCards, 'foreign-aid', ['duke'])) {
			action = 'foreign-aid';
		} else {
			action = 'taking-1';
		}

		return {
			action,
			against,
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
		return newCards;
	}

	OnCardLoss({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		return myCards[ 0 ];
	}
}


module.exports = exports = BOT;
