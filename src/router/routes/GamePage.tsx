import { useCallback, useEffect } from 'react';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';

import { rtdb } from 'src/firestore.config';
import { ref, get, onValue, set, update } from 'firebase/database';

import Button from 'src/components/UI/Button';
import HandTally from 'src/components/HandTally/HandTally';
import PlayFieldFlex from 'src/components/PlayField/PlayFieldFlex';

import useAuthContext from 'src/hooks/useAuthContext';
import useGameContext from 'src/hooks/useGameContext';
import { GameReducerTypes, GameState, IsActive, Status, PlayerPos } from 'src/@types';
import { dealHands, getGameRef, getPlayerOpponent, getPone } from 'src/utils/helpers';
import { INITIAL_GAME_STATE } from 'src/utils/constants';
import useModal from 'src/hooks/useModal';

export async function gameLoader({ params }: LoaderFunctionArgs) {
  try {
    const game = await get(ref(rtdb, `games/${params.gameId}`));
    return game.val();
  } catch (err) {
    console.log(err);
  }
}

const GamePage = () => {
  const game = useLoaderData() as GameState;

  const { gameState, dispatchGame } = useGameContext();
  const { userAuth } = useAuthContext();
  const userId = userAuth!.uid!;

  const { Modal, isModal, modalHandler } = useModal();
  const { player, opponent } = getPlayerOpponent(gameState.players, userId);

  async function dealHandler() {
    if (player !== PlayerPos.P_ONE) return;
    const gameRef = getGameRef(game.gameId);
    const deal = dealHands();
    const update: GameState = {
      ...gameState,
      handNum: gameState.handNum + 1,
      players: {
        player1: { ...gameState.players.player1, activePlayer: IsActive.ACTIVE },
        player2: { ...gameState.players.player2, activePlayer: IsActive.ACTIVE }
      },
      playerCards: {
        player1: { inHand: deal.hands.player1, played: {} },
        player2: { inHand: deal.hands.player2, played: {} }
      },
      deckCut: { status: Status.INVALID, card: deal.cut },
      crib: {},
      tally: null,
      turnTotals: {
        cardsPlayed: {},
        cardTotal: 0
      }
    };
    set(gameRef, update);
  }

  const resetHand = useCallback(() => {
    const newDealer = getPone(gameState.dealer);
    const gameRef = getGameRef(game.gameId);
    const deal = dealHands();
    update(gameRef, {
      ...gameState,
      dealer: newDealer,
      handNum: gameState.handNum + 1,
      players: {
        player1: { ...gameState.players.player1, activePlayer: IsActive.ACTIVE },
        player2: { ...gameState.players.player2, activePlayer: IsActive.ACTIVE }
      },
      playerCards: {
        player1: { inHand: deal.hands.player1, played: {} },
        player2: { inHand: deal.hands.player2, played: {} }
      },
      crib: INITIAL_GAME_STATE.crib,
      deckCut: { status: Status.INVALID, card: deal.cut },
      turnTotals: INITIAL_GAME_STATE.turnTotals,
      tally: INITIAL_GAME_STATE.tally
    });
  }, [game.gameId, gameState]);

  // function resetHand(callback?: () => void) {
  //   const newDealer = getPone(gameState.dealer);
  //   const gameRef = getGameRef(game.gameId);
  //   const deal = dealHands();
  //   update(gameRef, {
  //     ...gameState,
  //     dealer: newDealer,
  //     handNum: gameState.handNum + 1,
  //     players: {
  //       player1: { ...gameState.players.player1, activePlayer: IsActive.ACTIVE },
  //       player2: { ...gameState.players.player2, activePlayer: IsActive.ACTIVE }
  //     },
  //     playerCards: {
  //       player1: { inHand: deal.hands.player1, played: {} },
  //       player2: { inHand: deal.hands.player2, played: {} }
  //     },
  //     crib: INITIAL_GAME_STATE.crib,
  //     deckCut: { status: Status.INVALID, card: deal.cut },
  //     turnTotals: INITIAL_GAME_STATE.turnTotals,
  //     tally: INITIAL_GAME_STATE.tally
  //   }).then(() => callback && callback());
  // }

  function canStartGame() {
    return (
      Boolean(gameState.players.player1.displayName.length) &&
      Boolean(gameState.players.player2.displayName.length) &&
      !gameState.handNum &&
      !Object.keys(gameState.playerCards.player1.inHand).length
    );
  }

  const renderTally = useCallback(() => {
    modalHandler(true);
    const timer = setTimeout(() => {
      modalHandler(false);
      player === PlayerPos.P_ONE && resetHand();
    }, 16000);
  }, [player, modalHandler, resetHand]);

  useEffect(() => {
    const gameRef = getGameRef(game.gameId);
    const unsubscribeGame = onValue(
      gameRef,
      (snapshot) => {
        dispatchGame({ type: GameReducerTypes.UPDATE, payload: snapshot.val() });
      },
      (error) => console.log(error)
    );

    function unsubscriber() {
      unsubscribeGame();
    }

    return unsubscriber;
  }, []);

  useEffect(() => {
    if (!gameState.tally) return;
    renderTally();
  }, [gameState.tally]);

  return (
    <>
      {isModal && gameState.tally && (
        <Modal isVisible={true} title={'Hand Tally'} customStyles={'bg-neutral-800 text-white'}>
          <HandTally
            dealer={gameState.dealer}
            cut={gameState.deckCut.card!}
            player={{
              displayName: gameState.players[player].displayName,
              playerPos: player,
              cards: gameState.playerCards[player].played,
              points: gameState?.tally[player]
            }}
            opponent={{
              displayName: gameState.players[opponent].displayName,
              playerPos: opponent,
              cards: gameState.playerCards[opponent].played,
              points: gameState?.tally[opponent]
            }}
            crib={gameState?.tally.crib}
          />
        </Modal>
      )}
      <div className="relative h-screen bg-neutral-800">
        <div>
          <PlayFieldFlex gameId={game.gameId} />
        </div>
        {canStartGame() && player === PlayerPos.P_ONE && (
          <Button
            handler={dealHandler}
            customStyles="absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2">
            START
          </Button>
        )}
      </div>
    </>
  );
};

export default GamePage;
