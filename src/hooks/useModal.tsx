import React, { FC, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from 'src/components/UI/Button';

type ModalProps = {
  isVisible: boolean;
  title: string;
  modalHandler: (visible?: boolean) => void;
  customStyles?: string;
  children?: ReactNode;
};

const useModal = () => {
  const [isModal, setIsModal] = useState<boolean>(false);

  function modalHandler(visible?: boolean) {
    console.log('setting modal');

    setIsModal((prev) => (visible !== undefined ? visible : !prev));
  }

  const Modal: FC<ModalProps> = ({
    isVisible,
    title,
    modalHandler,
    customStyles = '',
    children
  }) => {
    function keyDownHandler(event: React.KeyboardEvent<HTMLDivElement>) {
      console.log(event);
      if (event.key === 'escape') modalHandler(false);
    }

    return (
      <>
        {isVisible &&
          createPortal(
            <>
              <div
                className={`${customStyles} absolute top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 animate-modal-slide-in rounded-lg bg-white p-4`}>
                <div>
                  <div className="flex items-center justify-between gap-8">
                    <h2 className=" text-xl font-extrabold">{title}</h2>
                    <Button handler={() => modalHandler(false)}>X</Button>
                  </div>
                  {children}
                </div>
              </div>
              <div
                onClick={() => modalHandler(false)}
                onKeyDown={keyDownHandler}
                className="absolute top-0 left-0 z-[900] h-full w-full bg-neutral-900 opacity-60"></div>
            </>,
            document.getElementById('overlay-root')!
          )}
      </>
    );
  };

  return { isModal, modalHandler, Modal };
};

export default useModal;
