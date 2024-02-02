import React, { useState, useRef, useEffect,useContext } from "react";
import solLogo from "../../../public/images/SOL 1.svg";
import ethLogo from "../../../public/images/eth-logo.png";
import hederaLogo from "../../../public/images/hederaLogo.png";
import Image from "next/image";
import telosLogo from "../../../public/images/teloslogo.png"

const Dropdown2 = ({ body, state, changeHandler }) => {
  const [isOpen, setIsOpen] = useState(false);

  const btnRef = useRef();

  useEffect(() => {
    const closeDropdown = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.body.addEventListener("click", closeDropdown);

    const handleUnload = () => {
      localStorage.removeItem('selectedChain');
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      document.body.removeEventListener("click", closeDropdown);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);


  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

 

  return (
    <div className="font-numans relative text-left ">
      <div className="mr-2">
        <button
          type="button"
          className="flex justify-center items-center w-full px-1 py-[9px] text-sm font-medium text-green-2 bg-green-1 border border-green-2 rounded-md focus:outline-none gap-1"
          style={{ boxShadow: "4px 4px 0px 0px #0A7128" }}
          id="options-menu"
          onClick={toggleDropdown}
          ref={btnRef}
        >
          {state === "Solana" && (
            <span>
              <Image src={solLogo} alt="solana logo" />
            </span>
          )}
          {state === "Hedera" && (
            <span>
              <Image
                src={hederaLogo}
                height={20}
                width={20}
                alt="hedera logo"
              />
            </span>
          )}
          {state === "Sepolia" || state === "Areon"&& (
            <span>
              <Image src={ethLogo} height={20} width={20} alt="sepolia logo" />
            </span>
          )}
          {state === "Telos" && (
            <span>
              <Image src={telosLogo} height={20} width={20} alt="telos logo" />
            </span>
          )}
          {state}
          <svg
            className={`w-5 h-5 ml-2 -mr-1 ${
              isOpen ? "transform rotate-180" : "" 
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-28 rounded-md shadow-lg bg-green-1 ring-1 ring-black ring-opacity-5 focus:outline-none border border-green-3 ">
          <div className="py-1">
            {body.map((option) => (
            <button
            key={option}
            onClick={() => {
              const lowercaseOption = option.toLowerCase();
              changeHandler(option);
              //setChainId(lowercaseOption);
              localStorage.setItem('selectedChain', lowercaseOption);
              setIsOpen(false);
            }}
            className="px-4 py-2 text-sm text-green-2 font-medium items-center hover:bg-gray-100 hover:text-gray-900 flex flex-row w-full gap-1"
          >
                {option === "Solana" && (
                  <span>
                    <Image src={solLogo}  height={20}
                      width={20} alt="solana logo" />
                  </span>
                )}
                {option === "Hedera" && (
                  <span>
                    <Image
                      src={hederaLogo}
                      height={20}
                      width={20}
                      alt="hedera logo"
                    />
                  </span>
                )}
                {(option === "Sepolia" || option === "Areon") && (
                  <span>
                    <Image
                      src={ethLogo}
                      height={20}
                      width={20}
                      alt="sepolia logo"
                    />
                  </span>
                )}
                 {option === "Telos" && (
                  <span>
                    <Image
                      src={telosLogo}
                      height={20}
                      width={20}
                      alt="telos logo"
                    />
                  </span>
                )}
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown2;
