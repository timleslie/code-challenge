'use strict';

const {
	ALLPLAYER,
	CARDS,
	DECK,
	ACTIONS,
} = require('../constants.js');

class BOT {
	OnTurn({ history, myCards, myCoins, otherPlayers, discardedCards }) {
		let action = ACTIONS[ Math.floor( Math.random() * ACTIONS.length ) ];
		const against = otherPlayers[ Math.floor( Math.random() * otherPlayers.length ) ].name;
		const scores = otherPlayers.map(p => [p.coins * p.cards, p])
		if( myCoins >= 7 ) {
			action = 'couping';
		} else if (myCards.includes('assassin') && myCoins >= 3) {
			action = 'assassination';
		} else if (myCards.includes('duke')) {
			action = 'taking-3';
		} else if (myCards.includes('ambassador')) {
			action = 'swapping';
		} else if (([...discardedCards, ...myCards]).filter(c => c === 'captain').length === 3 && myCards.includes('captain')) {
			action = 'stealing';
		} else if (([...discardedCards, ...myCards]).filter(c => c === 'ambassador').length === 3 && myCards.includes('captain')) {
			action = 'stealing';
		} else if (discardedCards.filter(c => c === 'duke').length === 3) {
			action = 'foreign-aid';
		} else {
			action = 'foreign-aid';
		}

		return {
			action,
			against,
		};
	}

	OnChallengeActionRound({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom}) {
		const cards = [...myCards, ...discardedCards];
		const card = {
			'taking-3': 'duke',
			'assassination': 'assassin',
			'stealing': 'captain',
			'swapping': 'captain',
		}[action];
		if (card && cards.filter(c => c === card).length === 3) {
			return true;
		}
		return false;
	}

	OnCounterAction({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom }) {
		if (action === 'foreign-aid' && myCards.includes('duke')) {
			return 'duke';
		}
		if (action === 'assassination' && myCards.includes('contessa')) {
			return 'contessa';
		}
		if (action === 'stealing') {
			if (myCards.includes('captain')) {
				return 'captain';
			}
			if (myCards.includes('ambassador')) {
				return 'ambassador';
			}
		}
		return false;
	}

	OnCounterActionRound({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom, card }) {
		const cards = [...myCards, ...discardedCards];
		if (cards.filter(c => c === card).length === 3) {
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
