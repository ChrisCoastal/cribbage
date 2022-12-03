import { FC, useRef } from 'react';
import { CardBoxHeight, CardBoxWidth, CardType } from 'src/@types';
import { getShuffledDeck } from 'src/utils/helpers';
import { CARD_FACES } from 'src/utils/constants';
import CardBox from '../CardBox/CardBox';

type CardsProps = {
  cardHeight: string;
  isFaceUp: boolean;
};

const Cards: FC<CardsProps> = ({ cardHeight, isFaceUp }) => {
  const deck = useRef<CardType[]>(getShuffledDeck());

  const hand = deck.current.slice(0, 6);

  function cardClickHandler(card: CardType) {
    console.log(card);
  }

  // const cardPosition = [
  //   'z-[20] left-0',
  //   'z-[21] left-8',
  //   'z-[22] left-16',
  //   'z-[23] left-24',
  //   'z-[24] left-32',
  //   'z-[25] left-40'
  // ];
  const cardPos = [
    'bg-red-200 col-start-1 col-end-4 row-start-1',
    'bg-blue-200 col-start-2 col-end-5 row-start-1',
    'bg-green-200 col-start-3 col-end-6 row-start-1',
    'bg-orange-200 col-start-4 col-end-7 row-start-1',
    'bg-purple-200 col-start-5 col-end-8 row-start-1',
    'bg-yellow-200 col-start-6 col-end-9 row-start-1'
  ];

  const cardCols = [
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    'grid-cols-8'
  ];

  const cardRotation = ['-rotate-3', 'rotate-3'];

  const handUI = (
    <div className={`grid ${cardCols[5]} grid-rows-1 ${cardHeight}`}>
      {/* <div className="bg-red-200 col-start-1 col-end-4 row-start-1"></div>
      <div className="bg-blue-200 col-start-2 col-end-5 row-start-1"></div>
      <div className="bg-green-200 col-start-3 col-end-6 row-start-1"></div>
      <div className="bg-orange-200 col-start-4 col-end-7 row-start-1"></div>
      <div className="bg-purple-200 col-start-5 col-end-8 row-start-1"></div>
      <div className="bg-yellow-200 col-start-6 col-end-9 row-start-1"></div> */}
      {hand.map((card, i) => {
        return isFaceUp ? (
          <div
            key={i}
            onClick={() => cardClickHandler(card)}
            className={`grid grid-rows-3 grid-columns-3 items-center border-solid border-black border rounded-[4%] ${
              cardPos[i]
            } ${cardRotation[i % 2]}`}>
            <div className="flex flex-col col-start-1 row-start-1 justify-self-center text-sm">
              <span>{card.faceValue}</span>
              <span>{card.suit.slice(0, 2)}</span>
            </div>
            <div className="flex flex-col col-start-3 row-start-3 justify-self-center text-sm">
              <div className="flex flex-col col-start-1 text-sm">
                <span>{card.faceValue}</span>
                <span>{card.suit.slice(0, 2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={i}
            onClick={() => cardClickHandler(card)}
            className={`border-solid border-black border rounded-[4%] ${cardPos[i]}`}></div>
        );
      })}
    </div>
  );
  return (
    // <div className="col-start-1 row-start-5 col-span-4 w-full">
    //   <div className="border border-black h-fit">{handUI}</div>
    // </div>
    <CardBox
      size={{ height: CardBoxHeight.LG, width: CardBoxWidth.LG_SIX }}
      placement="col-start-1 row-start-5 col-span-4"
      maxCards={6}>
      {handUI}
    </CardBox>
  );
};

export default Cards;
