import React, { FC, MouseEventHandler, ReactNode } from 'react';

type ButtonProps = {
  // size: string;
  handler?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  color?: string;
  customStyles?: string;
  children?: ReactNode;
};

const Button: FC<ButtonProps> = ({
  handler,
  type = 'button',
  color = 'primary',
  customStyles,
  children
}) => {
  const buttonColor =
    color === 'primary' ? 'bg-red-600 dark:bg-red-200' : 'bg-blue-600 dark:bg-blue-200';

  return (
    <button
      type={type}
      onClick={handler}
      className={`${customStyles} ${buttonColor} cursor-pointer rounded-full py-1 px-4 hover:bg-red-400`}
    >
      {children}
    </button>
  );
};

export default Button;
