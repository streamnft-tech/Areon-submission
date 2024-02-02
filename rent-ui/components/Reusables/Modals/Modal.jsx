import React, { useEffect, useContext, Fragment } from "react";
import { ModalContext } from "../../../context/ModalContext";
import Button from "../Button";
import { CloseIcon } from "../Icons";
import { Dialog, Transition } from "@headlessui/react";

import * as Styles from "./modalStyles";

const Modal = ({
  headerText,
  children,
  buttonText,
  buttonIcon,
  buttonHandler,
  disable,
  error=""
}) => {
  const { openModal, setOpenModal } = useContext(ModalContext);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [openModal]);

  return (
    <Transition appear show={openModal} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[1000]"
        onClose={() => setOpenModal(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0  bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-visible">
          <div className="flex h-full items-center justify-center text-center ">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-3/5 h-screen max-h-[600px] transform bg-[#121212] border-2 border-solid border-[#292929] text-left align-middle shadow-xl transition-all rounded-lg">
                <Styles.ModalHeader>
                  <h5>{headerText}</h5>
                  <Styles.Closebutton>
                    <CloseIcon
                      size={28}
                      onClick={() => {
                        setOpenModal(false);
                      }}
                    />
                  </Styles.Closebutton>
                </Styles.ModalHeader>
                <Styles.ModalBody>{children}</Styles.ModalBody>
                <Styles.ModalFooter>
                  <div className="flex items-center"> 
                  {error !== "" &&
                  <span className="text-red mr-2">ERROR : </span> 
                }
                  <span className="text-white flex items-center">{error}</span>
                  </div>
                  <Button
                    disabled={disable}
                    clickHandler={buttonHandler}
                    className="hover:bg-gradient-to-r from-[#30B750] to-[#30B750] !items-center"
                  >
                    {buttonText}{" "}
                    <span className="px-2 pr-1">
                      {buttonIcon ? buttonIcon : null}
                    </span>
                  </Button>
                </Styles.ModalFooter>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
