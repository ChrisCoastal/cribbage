import { CardName, CardType, Suit } from 'src/@types';
import { CARDS_IN_DECK, CARDS_PER_SUIT, HAND_SIZE } from './constants';

export function createDeck(): CardType[] {
  const newDeck: CardType[] = [];

  const suits: Suit[] = [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds];
  let faceValue = 1;

  for (let i = 0; i < CARDS_IN_DECK; i++) {
    if (i !== 0 && !(i % CARDS_PER_SUIT)) {
      suits.shift();
      faceValue = 1;
    }

    const name: CardName = Object.values(CardName)[faceValue - 1];
    const card = {
      id: i,
      suit: suits[0],
      name,
      faceValue
    };

    newDeck.push(card);
    faceValue++;
  }
  return newDeck;
}

export function shuffleDeck(deck: CardType[]) {
  // Fisher–Yates Shuffle
  let unshuffled = deck.length;
  let t, cardIndex;

  while (unshuffled) {
    // select a random card from the unshuffled part of the array
    cardIndex = Math.floor(Math.random() * unshuffled--);

    // place the random card at the back of the unshuffled cards
    t = deck[unshuffled];
    deck[unshuffled] = deck[cardIndex];
    deck[cardIndex] = t;
  }

  return deck;
}

// FIXME: the deck should only be created once? and kept in state?
// useDeck?
export function getShuffledDeck() {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);

  return shuffledDeck;
}

// TODO: does this need to be coordinated with firebase?
// yes, it needs to be kept aligned
export function dealHands(): {
  player: CardType[];
  opponent: CardType[];
} {
  const hands = {
    player: [] as CardType[],
    opponent: [] as CardType[]
  };

  const shuffledDeck = getShuffledDeck();

  for (let i = 0; i < HAND_SIZE; i++) {
    i % 2 ? hands.opponent.push(shuffledDeck[i]) : hands.player.push(shuffledDeck[i]);
  }

  return hands;
}

//TODO:
// isPairs
//