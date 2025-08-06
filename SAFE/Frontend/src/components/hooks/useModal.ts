import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface InputModalState {
  isOpen: boolean;
  title: string;
  placeholder: string;
  inputType: 'text' | 'email';
  onSubmit?: (value: string) => void;
  validation?: (value: string) => string | null;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [inputModalState, setInputModalState] = useState<InputModalState>({
    isOpen: false,
    title: '',
    placeholder: '',
    inputType: 'text'
  });

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK'
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const showInput = (
    title: string,
    placeholder: string,
    onSubmit: (value: string) => void,
    inputType: 'text' | 'email' = 'text',
    validation?: (value: string) => string | null
  ) => {
    setInputModalState({
      isOpen: true,
      title,
      placeholder,
      inputType,
      onSubmit,
      validation
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const closeInputModal = () => {
    setInputModalState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modalState,
    inputModalState,
    showAlert,
    showConfirm,
    showInput,
    closeModal,
    closeInputModal
  };
}