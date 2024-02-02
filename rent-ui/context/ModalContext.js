import { createContext, useState } from "react";

export const ModalContext = createContext();

const ModalContextWrapper = ({ children }) => {
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState({});

  return (
    <ModalContext.Provider
      value={{ openModal, setOpenModal, modalData, setModalData }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContextWrapper;
