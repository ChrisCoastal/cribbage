import { CardType, GameReducerActions, GameReducerTypes, GameState } from 'src/@types';

const gameReducer = (state: GameState, action: GameReducerActions): GameState => {
  const { type, payload } = action;

  switch (type) {
    case GameReducerTypes.CREATE_GAME: {
      return payload;
    }
    case GameReducerTypes.JOIN_PLAYER: {
      return payload;
    }

    case GameReducerTypes.UPDATE: {
      const updatedState = {
        ...payload,
        handNum: payload?.handNum || 0,
        playerCards: {
          player1: {
            inHand: payload?.playerCards?.player1?.inHand || {},
            played: payload?.playerCards?.player1?.played || {}
          },
          player2: {
            inHand: payload?.playerCards?.player2?.inHand || {},
            played: payload?.playerCards?.player2?.played || {}
          }
        },
        crib: payload?.crib || {},
        deckCut: payload.deckCut || null,
        turn: {
          cardsPlayed: payload?.turnTotals?.cardsPlayed || {},
          cardTotal: payload.turnTotals.cardTotal
        }
      };

      return updatedState;
    }

    case GameReducerTypes.HAND_TALLY: {
      const updatedState = {
        ...state,
        tally: {
          ...state.tally,
          player1: payload.player1,
          player2: payload.player2,
          crib: payload.crib
        }
      };
      return updatedState;
    }

    default:
      return state;
  }
};

export default gameReducer;
