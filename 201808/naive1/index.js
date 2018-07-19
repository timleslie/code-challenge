'use strict';

const {
	ALLPLAYER,
	CARDS,
	DECK,
	ACTIONS,
} = require('../constants.js');

const count = (card, visible) => visible.filter(c => c === card).length;

class BOT {
	OnTurn({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		const against = otherPlayers[ Math.floor( Math.random() * otherPlayers.length ) ].name;
		const scores = otherPlayers.map(p => [p.coins * p.cards, p])
		const visibleCards = [...myCards, ...discardedCards];

		let action;
		if (myCards.includes('assassin') && myCoins >= 3) {
			action = 'assassination';
		} else if( myCoins >= 7 ) {
			action = 'couping';
		} else if (myCards.includes('duke')) {
			action = 'taking-3';
		} else if (myCards.includes('ambassador')) {
			action = 'swapping';
		} else if (count('captain', visibleCards) === 3 && count('ambassador', visibleCards) === 3 &&
			myCards.includes('captain')) {
			action = 'stealing';
		} else if (count('duke', discardedCards) === 3) {
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
			'swapping': 'captain',
		}[action];
		if (card && visibleCards.filter(c => c === card).length === 3) {
			return true;
		}
		return false;
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
		if (visibleCards.filter(c => c === card).length === 3) {
			return true
		}
		return false;
	}

	OnSwappingCards({ history, myCards, myCoins, otherPlayers, discardedCards, newCards }) {
		return newCards;
	}

	OnCardLoss({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		return myCards[ 0 ];
	}
}


module.exports = exports = BOT;
