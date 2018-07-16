'use strict';

const {
	ALLPLAYER,
	CARDS,
	DECK,
	ACTIONS,
} = require('../constants.js');


const OnTurn = ({ history, myCards, myCoins, otherPlayers, discardedCards }) => {
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
		action = 'taking-1';
	}

	return {
		action,
		against,
	};
};

const OnChallengeActionRound = ({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom, toWhom }) => {
	const cards = [...myCards, ...discardedCards];
	switch (action) {
		case 'taking-3':
			if (cards.filter(c => c === 'duke').length === 3) {
				return true
			}
			break;
		case 'assassination':
			if (cards.filter(c => c === 'assassin').length === 3) {
				return true
			}
			break;
		case 'stealing':
			if (cards.filter(c => c === 'captain').length === 3) {
				return true
			}
			break;
		case 'swapping':
			if (cards.filter(c => c === 'captain').length === 3) {
				return true
			}
		break;
}
	return false;
};

const OnCounterAction = ({ history, myCards, myCoins, otherPlayers, discardedCards, action, byWhom }) => {
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
};

const OnCounterActionRound = ({ history, myCards, myCoins, otherPlayers, discardedCards, action, card, byWhom, toWhom }) => {
	const cards = [...myCards, ...discardedCards];
	if (cards.filter(c => c === card).length === 3) {
		console.info(cards, action, card, byWhom, toWhom);
		return true
	}
	// console.info('COUNTER', action, card, byWhom, toWhom);
	return false;
};

const OnSwappingCards = ({ history, myCards, myCoins, otherPlayers, discardedCards, newCards }) => {
	return newCards;
};

const OnCardLoss = ({ history, myCards, myCoins, otherPlayers, discardedCards }) => {
	// console.info(myCards);
	return myCards[ 0 ];
};


module.exports = exports = {
	OnTurn,
	OnChallengeActionRound,
	OnCounterAction,
	OnCounterActionRound,
	OnSwappingCards,
	OnCardLoss,
};
