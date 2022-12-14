import { FC, useEffect, useState } from 'react';
import {
  CardBoxHeight,
  CardBoxWidth,
  CardOverlap,
  CardsIndex,
  CardSize,
  CardType,
  GameId,
  IsActive,
  PlayerPos,
  ScoreType,
  Status,
  TallyPoints
} from 'src/@types';

import { set, push, update } from 'firebase/database';

import {
  expectGo,
  filterCard,
  getPlayerOpponent,
  getInHandRef,
  getPlayerCardsPlayedRef,
  getCribRef,
  getPlayerRef,
  getPlayersRef,
  getCardTotalRef,
  getCardsPlayedRef,
  getTurnRef,
  getDeckRef,
  getScoreRef,
  isCardValid,
  isPegPoints,
  isPlayerActive,
  isScorePoints,
  getPlayerScoreRef,
  getPone,
  updateCardTotal,
  getGameRef,
  isPegJack,
  getGameTalliesRef,
  getTallyRef,
  isWinner
} from 'src/utils/helpers';

import Avatar from 'src/components/Opponent/Opponent';
import Board from 'src/components/Board/Board';
import CardBox from 'src/components/CardBox/CardBox';
import Crib from 'src/components/Crib/Crib';
import Deck from 'src/components/Deck/Deck';
import PlayingCard from 'src/components/PlayingCard/PlayingCard';
import Score from 'src/components/Score/Score';

import useAuthContext from 'src/hooks/useAuthContext';
import useGameContext from 'src/hooks/useGameContext';

type PlayFieldProps = {
  gameId: GameId;
};

const PlayField: FC<PlayFieldProps> = ({ gameId }) => {
  const [go, setGo] = useState<boolean>(false);

  const { userAuth } = useAuthContext();
  const userId = userAuth!.uid!;

  const { gameState } = useGameContext();

  const { player, opponent } = getPlayerOpponent(gameState.players, userId);
  const gameRef = getGameRef(gameId);
  const gameScore = getGameTalliesRef(gameId);
  const playerHand = Object.values(gameState.playerCards[player].inHand);
  const opponentHand = Object.values(gameState.playerCards[opponent].inHand);
  const playerPlayed = Object.values(gameState.playerCards[player].played);
  const opponentPlayed = Object.values(gameState.playerCards[opponent].played);
  const numCardsPlayed = playerPlayed.length + opponentPlayed.length;
  const renderPlayerHand = renderCards(playerHand, true, CardSize.LG, CardOverlap.TWO_THIRDS, true);
  const renderOpponentHand = renderCards(opponentHand, false, CardSize.SM, CardOverlap.TWO_THIRDS);
  const renderPlayerPlayed = renderCards(playerPlayed, true, CardSize.MD, CardOverlap.HALF);
  const renderOpponentPlayed = renderCards(opponentPlayed, true, CardSize.MD, CardOverlap.HALF);
  const dealer = gameState.dealer;
  const pone = getPone(dealer);

  useEffect(() => {
    if (!numCardsPlayed) return;
    if (numCardsPlayed !== 8) return;
    player === PlayerPos.P_ONE && tallyHand();
  }, [numCardsPlayed]);

  //TODO: should all refs be moved into an object?

  function addCardToCrib(card: CardType, callback?: () => void): void {
    const playerHandRef = getInHandRef(gameId, player);
    const cribRef = getCribRef(gameId);
    const cribKey = push(cribRef).key;
    const updatedCrib = { ...gameState.crib, [cribKey!]: card };
    // const pushCribRef = push(cribRef);
    const updatedHand = filterCard(gameState.playerCards[player].inHand, card.id);
    set(playerHandRef, updatedHand)
      .then(() => {
        set(cribRef, updatedCrib);
      })
      .then(callback);
  }

  function updateActivePlayer(active: 'pone' | 'toggle' | 'inactive', callback?: () => void) {
    switch (active) {
      case 'toggle': {
        const playersRef = getPlayersRef(gameId);
        update(playersRef, {
          [player]: { ...gameState.players[player], activePlayer: IsActive.NOT_ACTIVE },
          [opponent]: { ...gameState.players[opponent], activePlayer: IsActive.ACTIVE }
        }).then(() => callback);
        break;
      }
      case 'pone': {
        const playerRef = getPlayerRef(gameId, pone);
        update(playerRef, { ...gameState.players[pone], activePlayer: IsActive.ACTIVE }).then(
          () => callback
        );
        break;
      }
      case 'inactive': {
        const playerRef = getPlayerRef(gameId, player);
        update(playerRef, {
          ...gameState.players[player],
          activePlayer: IsActive.NOT_ACTIVE
        }).then(() => callback);
        break;
      }
      default:
        return;
    }
  }

  function scoreHand() {
    const playerHandTally = isScorePoints(
      gameState.playerCards[player].played,
      gameState.deckCut.card!
    );
    const opponentHandTally = isScorePoints(
      gameState.playerCards[opponent].played,
      gameState.deckCut.card!
    );
    const cribTally = isScorePoints(gameState.crib, gameState.deckCut.card!, 'crib');

    return { playerHandTally, opponentHandTally, cribTally };
  }

  function getPlayerScores(
    playerHandTally: TallyPoints,
    opponentHandTally: TallyPoints,
    cribTally: TallyPoints
  ) {
    const playerScore =
      player === dealer
        ? playerHandTally.totalPoints + cribTally.totalPoints
        : playerHandTally.totalPoints;
    const opponentScore =
      opponent === dealer
        ? opponentHandTally.totalPoints + cribTally.totalPoints
        : opponentHandTally.totalPoints;

    const updatedScore = {
      [player]: {
        cur: gameState.score[player].cur + playerScore,
        prev: gameState.score[player].cur
      },
      [opponent]: {
        cur: gameState.score[opponent].cur + opponentScore,
        prev: gameState.score[opponent].cur
      }
    } as { player1: ScoreType; player2: ScoreType };

    return updatedScore;
  }

  function tallyHand() {
    const score = scoreHand();
    const tally = {
      [player]: score.playerHandTally,
      [opponent]: score.opponentHandTally,
      crib: score.cribTally
    };
    const updatedScore = getPlayerScores(
      score.playerHandTally,
      score.opponentHandTally,
      score.cribTally
    );
    const winner = isWinner(updatedScore, dealer);
    const tallyRef = getTallyRef(gameId);
    const scoreRef = getScoreRef(gameId);
    set(tallyRef, tally).then(() => {
      // if the pone has won, dealer's score is not recorded (pone counts first)
      winner === pone ? update(scoreRef, updatedScore[pone]) : update(scoreRef, updatedScore);
    });
  }

  function cutDeckHandler(cutStatus: Status) {
    const deckCutRef = getDeckRef(gameId);
    switch (cutStatus) {
      case Status.INVALID: {
        set(deckCutRef, { status: Status.INVALID, card: gameState.deckCut.card });
        break;
      }
      case Status.VALID: {
        set(deckCutRef, { status: Status.VALID, card: gameState.deckCut.card });
        break;
      }
      case Status.COMPLETED: {
        const jack = isPegJack(gameState.deckCut.card!.faceValue!);
        if (
          gameState.deckCut.status !== Status.VALID ||
          gameState.players[player].activePlayer === IsActive.NOT_ACTIVE
        )
          return;
        set(deckCutRef, { status: Status.COMPLETED, card: gameState.deckCut.card });
        if (jack) {
          const scoreRef = getScoreRef(gameId);
          update(scoreRef, {
            [opponent]: {
              cur: gameState.score[opponent].cur + jack,
              prev: gameState.score[opponent].cur
            }
          });
        }
        break;
      }
      default:
        return;
    }
  }

  function playCard(card: CardType) {
    const gameRef = getGameRef(gameId);
    const playerHandRef = getInHandRef(gameId, player);
    const playerCardsPlayedRef = getPlayerCardsPlayedRef(gameId, player);
    const cardsPlayedRef = getCardsPlayedRef(gameId);
    const addPlayerPlayedKey = push(playerCardsPlayedRef).key;
    const addPlayedKey = push(cardsPlayedRef).key;

    const updatedHand = filterCard(gameState.playerCards[player].inHand, card.id);
    const updatedPlayerPlayed = {
      ...gameState.playerCards[player].played,
      [addPlayerPlayedKey!]: card
    };
    const updatedPlayed = { ...gameState.turnTotals.cardsPlayed, [addPlayedKey!]: card };
    const updates = {
      playerCards: {
        ...gameState.playerCards,
        [player]: {
          played: updatedPlayerPlayed,
          inHand: updatedHand
        }
      },
      turnTotals: {
        ...gameState.turnTotals,
        cardsPlayed: updatedPlayed
      }
    };

    update(gameRef, updates);
  }

  function resetCardTotal() {
    const turnRef = getTurnRef(gameId);
    set(turnRef, { cardsPlayed: {}, cardTotal: 0 });
  }

  function cardClickHandler(targetCard: CardType) {
    if (!isPlayerActive(gameState.players[player])) return;
    if (!isCardValid(targetCard.playValue, gameState.turnTotals.cardTotal)) return;
    if (gameState.deckCut.status === Status.VALID) return;

    // FIXME: move to useEffect?
    if (playerHand.length > 4) {
      addCardToCrib(targetCard);
      // if 2nd card has just been moved to crib (=== 5), make player inactive
      playerHand.length === 5 && updateActivePlayer('inactive');
      if (Object.keys(gameState.crib).length === 3) {
        cutDeckHandler(Status.VALID);
        updateActivePlayer('pone');
      }
    }
    if (playerHand.length <= 4) {
      playCard(targetCard);
      const cardTotalRef = getCardTotalRef(gameId);
      const updatedCardTotal = updateCardTotal(
        targetCard.playValue,
        gameState.turnTotals.cardTotal
      );
      set(cardTotalRef, updatedCardTotal);
      const points = isPegPoints(
        targetCard,
        gameState.turnTotals,
        gameState.playerCards[player].inHand,
        gameState.playerCards[opponent].inHand
      );
      const playerScore = gameState.score[player].cur;
      const playerScoreRef = getPlayerScoreRef(gameId, player);
      points && set(playerScoreRef, { cur: playerScore + points, prev: playerScore });
      if (
        expectGo(opponentHand, updatedCardTotal) &&
        !expectGo(playerHand, updatedCardTotal, targetCard)
      ) {
        renderGo();
      } else if (
        expectGo(opponentHand, updatedCardTotal) &&
        expectGo(playerHand, updatedCardTotal, targetCard) &&
        !isLastCard(gameState.playerCards.player1.inHand, gameState.playerCards.player2.inHand)
      ) {
        renderGo(resetCardTotal);
        updateActivePlayer('toggle');
      } else if (
        expectGo(opponentHand, updatedCardTotal) &&
        expectGo(playerHand, updatedCardTotal, targetCard) &&
        isLastCard(gameState.playerCards.player1.inHand, gameState.playerCards.player2.inHand)
      ) {
        renderGo();
        updateActivePlayer('toggle');
      } else {
        updateActivePlayer('toggle');
      }
    }
  }

  function isLastCard(playerHand: CardsIndex | null, opponentHand: CardsIndex | null): boolean {
    return Object.keys(playerHand || {}).length + Object.keys(opponentHand || {}).length === 1;
  }

  function renderGo(callback?: () => void) {
    setGo(true);
    const timer = setTimeout(() => {
      setGo(false);
      if (callback) callback();
    }, 1000);
  }

  function renderCards(
    cards: CardType[] = [],
    faceUp: boolean,
    cardSize: CardSize,
    overlap: CardOverlap,
    playerHand = false
  ) {
    return cards.map((card, i) => (
      <PlayingCard
        key={card.id}
        isFaceUp={faceUp}
        cardSize={cardSize}
        cardIndex={i}
        card={card}
        overlap={overlap}
        valid={playerHand ? isCardValid(card.playValue, gameState.turnTotals.cardTotal) : undefined}
        handler={playerHand ? cardClickHandler : undefined}
      />
    ));
  }

  return (
    <>
      <div className="relative grid h-full grid-cols-[1fr] items-center justify-items-center gap-2 py-12 px-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex w-full justify-between">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center justify-center">
                <Avatar displayName={gameState.players[opponent].displayName} />
                <CardBox
                  size={{ height: CardBoxHeight.SM, width: CardBoxWidth.SM_SIX }}
                  maxCards={6}
                  overlap={CardOverlap.TWO_THIRDS}>
                  {renderOpponentHand}
                </CardBox>
              </div>
              <div className="rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 p-2">
                <CardBox
                  size={{ height: CardBoxHeight.MD, width: CardBoxWidth.MD_FOUR_HALF }}
                  maxCards={4}
                  overlap={CardOverlap.HALF}
                  placement="self-center place-self-center">
                  {renderOpponentPlayed}
                </CardBox>

                <div>
                  <div className="flex flex-col items-center gap-1 py-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Deck
                        cutDeck={gameState.deckCut}
                        isPone={player === pone}
                        callback={cutDeckHandler}
                      />
                      <Crib cribCards={gameState.crib} />
                    </div>
                    <div>
                      count: {gameState.turnTotals.cardTotal} {go && 'GO!!'}
                    </div>
                    <div>
                      {gameState.players[player].activePlayer === IsActive.ACTIVE
                        ? 'your turn'
                        : `opponent's turn`}
                    </div>
                  </div>
                </div>
                <CardBox
                  size={{ height: CardBoxHeight.MD, width: CardBoxWidth.MD_FOUR_HALF }}
                  maxCards={4}
                  overlap={CardOverlap.HALF}
                  placement="self-center place-self-center">
                  {renderPlayerPlayed}
                </CardBox>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              <Score
                player={{
                  displayName: gameState.players[player].displayName,
                  curScore: gameState.score[player].cur
                }}
                opponent={{
                  displayName: gameState.players[opponent].displayName,
                  curScore: gameState.score[opponent].cur
                }}
              />
              <Board />
            </div>
          </div>
          <div>
            <CardBox
              size={{ height: CardBoxHeight.LG, width: CardBoxWidth.LG_SIX }}
              maxCards={6}
              overlap={CardOverlap.TWO_THIRDS}
              placement="self-center place-self-center">
              {renderPlayerHand}
            </CardBox>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayField;
