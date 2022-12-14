import React, { FC, ReactNode, useEffect, useState } from 'react';
import Button from 'src/components/UI/Button';

type ModalProps = {
  modalContent: ReactNode;
  callback?: (isVisible: boolean, toggleModal: () => void) => void;
  children?: ReactNode;
};

const Modal: FC<ModalProps> = ({ modalContent, callback, children }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  function toggleModal() {
    setIsVisible((prev) => !prev);
  }

  useEffect(() => {
    setIsVisible(isVisible ? true : false);
  }, []);

  return (
    <>
      <div className="absolute top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white">
        <Button></Button>
        {modalContent}
      </div>
      <div
        onClick={toggleModal}
        className="absolute top-0 left-0 z-[900] h-full w-full bg-neutral-900 opacity-60"></div>
    </>
  );
};

export default Modal;
