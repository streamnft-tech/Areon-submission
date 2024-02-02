import React, { useState, useEffect, useRef, useContext } from "react";
import logo from "../../../public/images/Group 188.svg";
import logo1 from "../../../public/images/logo_1.svg";
import rewardLogo from "../../../public/images/reward_box.svg";
import Image from "next/image";
import { useRouter } from "next/router";
import Dropdown2 from "../Dropdown/Dropdown2";
import walletIcon from "../../../public/images/Wallet.svg";
import { useAccount } from "wagmi";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import Header2 from "./Header2";
import Ellipsis from "./Ellipsis";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getUserRewards } from "../../../services";
import { HederaContext } from "../../../context/HederaContext";
import {
  hashconnect,
  pairHashpack,
  unpairHashpack,
  initHashpack,
  getRewardValue,
} from "../../../util/hashConnectProvider";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { hederaMainnetChainId } from "../../../util/common";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { setIsPaired, isPaired } = useContext(HederaContext);
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const [walletAddress, setWalletAddress] = useState("Connect");
  const navbarRef = useRef(null);

  //const [selectedOption, setSelectedOption] = useState("My Assets");
  const [pagesSelectedOption, pagesSetSelectedOption] = useState("Rent");

  const router = useRouter();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [reward, setReward] = useState(0);
  const [chainValue, setChainValue] = useState("Hedera");
  const [hederaText,setHederaText]=useState('')

  useEffect(() => {
    // const storedChainValue = localStorage.getItem('selectedChain');
    const storedChainValue = router.query.chain;
    if (storedChainValue) {
      setChainValue(
        storedChainValue.charAt(0).toUpperCase() + storedChainValue.slice(1)
      );
    }
  }, [router.query.chain]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const threshold = 710;

      if (isMenuOpen && windowWidth > threshold) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [navbarRef, isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  //Changes

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getRewardPoint = async () => {
    let result;
    if (router.query.chain === "hedera") {
      result = await getRewardValue("", hederaMainnetChainId);
    } else if (router.query.chain === "solana") {
      result = await getRewardValue(wallet.publicKey.toBase58(), 0);
    } else if (router.query.chain === "sepolia") {
      result = await getRewardValue(address, 11155111);
    } else if(router.query.chain === "telos"){
      result = await getRewardValue(address, 41)
    }
    setReward(result);
  };

 

  const handeleHedra = async () => {
    if (isPaired) {
      await unpairHashpack();
      localStorage.removeItem("hashconnectData");
      setHederaText("CONNECT WALLET");
      setIsPaired(false);
    } else {
      const hashconnectData = localStorage.getItem("hashconnectData");
      const parsedData = hashconnectData ? JSON.parse(hashconnectData) : null;
      if (
        hashconnectData == null ||
        (parsedData && parsedData.pairingData.length > 0)
      ) {
        await pairHashpack();
        hashconnect.pairingEvent.once((pairdata) => {
          const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
          setHederaText(`${JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length - 1].accountIds[0].slice(0, 5)}...${JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length - 1].accountIds[0].slice(-3)}`);

        
          setIsPaired(true);
        });
      } else {
        initHashpack().then(() => {
          if (localStorage.getItem("hashconnectData") && JSON.parse(localStorage.getItem("hashconnectData"))
          .pairingData.length > 0) {
            const length = JSON.parse(localStorage.getItem("hashconnectData"))
              .pairingData.length;
            setHederaText(
              JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
                length - 1
              ].accountIds[0]
            );
          }
          setIsPaired(true);
        });
      }
     
    }; 
    //setWallet(address);// Call the callback function with the new wallet address
  };

  /*useEffect(() => {
    getRewardValue();

    const determineSelectedOption = () => {
      if (router.pathname.includes("lend")) {
        setSelectedOption("My Assets");
      } else if (router.pathname.includes("rentals")) {
        setSelectedOption("My Rentals");
      } else {
        setSelectedOption("Marketplace");
      }
    };

    determineSelectedOption();
  }, [router.pathname]);*/

  useEffect(() => {
    getRewardPoint();
  }, [walletAddress, isPaired, isConnected, wallet]);

  useEffect(() => {
    if (router.query.chain === "hedera") {
      if (
        localStorage.getItem("hashconnectData") &&
        JSON.parse(localStorage.getItem("hashconnectData")).pairingData.length > 0
      ) {
        initHashpack().then(() => {
          const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
          setWalletAddress(
            JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
              length - 1
            ].accountIds[0]
          );
          setIsPaired(true);
        });
      } else {
        setIsPaired(false);
        setWalletAddress("Connect");
      }
    }

    if (router.query.chain === "sepolia" || router.query.chain === "telos") {
      if (isConnected) {
        setWalletAddress(address);
      } else {
        if(router.pathname.includes("myassets")){
        openConnectModal();
        }
        setWalletAddress("Connect");      }
    }
    if (router.query.chain === "solana") {
      if (connected) {
        setWalletAddress(publicKey?.toBase58());
      } else {
        setWalletAddress("Connect");
      }
    }
    if (router.query.chain === "areon" ) {
      connectMetaMask(); 
    }
    if (router.query.chain === "solana") {
      if (connected) {
        setWalletAddress(publicKey?.toBase58());
      } else {
        setWalletAddress("Connect");
      }
    }
  }, [router.query.chain, router.pathname, address, publicKey]);


  const connectMetaMask = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const chain = await window.ethereum.request({ method: 'eth_chainId' });
            setWalletAddress(accounts[0]);
        } catch (error) {
            console.error("Could not get accounts:", error);
        }
    } else {
        window.alert("Please install MetaMask!");
    }
};
  const clickHandlerPages = (item) => {
    if (item === "Rent") {
      pagesSetSelectedOption("Rent");
    } else if (item === "Loan") {
      pagesSetSelectedOption("Loan");
    } else if (item === "Utilities") {
      pagesSetSelectedOption("Utilities");
    } else {
      pagesSetSelectedOption("Dashboard");
    }
  };

  const handleChange = (value) => {
    setChainValue(value);
    router.push(`/${value.toLowerCase()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Clicked outside the dropdown, close it
        setDropdownOpen(false);
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener("click", handleClickOutside);

    // Clean up the event listener when the component is unmounted
    return () => {
      document.body.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const connectWallet = async () => {
    if (router.query.chain === "sepolia" || router.query.chain === "telos") {
      if (isConnected) {
        openAccountModal();
      } else {
        openConnectModal();
      }
    }
    if (router.query.chain === "hedera") {
      handeleHedra();
    }
    if (router.query.chain === "solana") {
      if (connected) {
        wallet.disconnect();
      } else {
        setVisible(true);
      }
    }
    if (router.query.chain === "areon") {
      connectMetaMask();
    }
  };

  return (
    <div className="z-[1000] sticky top-0 w-full ">
      <Header2 />
      <nav className=" bg-green-1  px-2 h-16 ">
        <div
          ref={navbarRef}
          className="min-w-screen flex flex-wrap items-center justify-between px-4 py-[0.6rem] flex-grow"
        >
          <div className="flex items-center space-x-4 ">
            <div className="cursor-pointer flex gap-10 items-center justify-start">
              <Image
                src={logo1}
                alt="stream NFT Logo"
                className="block sm:hidden"
                onClick={() => router.push("/")}
              />
              <Image
                src={logo}
                alt="Desktop Logo"
                className="hidden sm:block"
                onClick={() => router.push("/")}
              />
            </div>
            <ul
              className={`font-numans text-sm flex items-center flex-col md:flex-row space-x-4 md:flex-nowrap md:flex  ${
                isMenuOpen
                  ? "absolute top-[95px] -left-4 right-0 block z-[999] items-center justify-center bg-green-1"
                  : "relative hidden"
              }`}
            >
              <button
                className={`flex items-center border-none p-0 ${
                  pagesSelectedOption === "Rent" ? "selected" : ""
                }`}
                onClick={() => clickHandlerPages("Rent")}
              >
                <div
                  className="flex items-center justify-center py-2 md:px-3 rounded font-medium  text-green-2 hover:text-green-4 "
                  style={{
                    color:
                      pagesSelectedOption === "Rent" ? "#23963E" : "#1A4D27",
                  }}
                >
                  {pagesSelectedOption === "Rent" ? (
                    <span>
                      <span style={{ borderBottom: "1px solid #23963E" }}>
                        R
                      </span>
                      <span>ent</span>
                    </span>
                  ) : (
                    <span>Rent</span>
                  )}
                </div>
              </button>
              <button
                className={`flex items-center border-none p-0 ${
                  pagesSelectedOption === "Loan" ? "selected" : ""
                }`}
                onClick={() => clickHandlerPages("Loan")}
              >
                <div
                  className="flex items-center justify-center py-2 md:px-3 rounded font-medium text-green-2 hover:text-green-4"
                  style={{
                    color:
                      pagesSelectedOption === "Loan" ? "#23963E" : "#1A4D27",
                  }}
                >
                  {pagesSelectedOption === "Loan" ? (
                    <span>
                      <span style={{ borderBottom: "1px solid #23963E" }}>
                        L
                      </span>
                      <span>oan</span>
                    </span>
                  ) : (
                    <span>Loan</span>
                  )}
                </div>
              </button>
              <button
                className={`flex items-center border-none p-0 ${
                  pagesSelectedOption === "Utilities" ? "selected" : ""
                }`}
                onClick={() => clickHandlerPages("Utilities")}
              >
                <div
                  className="flex items-center justify-center py-2 md:px-3 rounded font-medium text-green-2 hover:text-green-4"
                  style={{
                    color:
                      pagesSelectedOption === "Utilities"
                        ? "#23963E"
                        : "#1A4D27",
                  }}
                >
                  {pagesSelectedOption === "Utilities" ? (
                    <span>
                      <span style={{ borderBottom: "1px solid #23963E" }}>
                        U
                      </span>
                      <span>tilities</span>
                    </span>
                  ) : (
                    <span>Utilities</span>
                  )}
                </div>
              </button>
              <button
                className={`flex items-center border-none p-0 ${
                  pagesSelectedOption === "Dashboard" ? "selected" : ""
                }`}
                onClick={() => clickHandlerPages("Dashboard")}
              >
                <div
                  className="flex items-center justify-center py-2 md:px-3 rounded font-medium text-green-2 hover:text-green-4"
                  style={{
                    color:
                      pagesSelectedOption === "Dashboard"
                        ? "#23963E"
                        : "#1A4D27",
                  }}
                >
                  {pagesSelectedOption === "Dashboard" ? (
                    <span>
                      <span style={{ borderBottom: "1px solid #23963E" }}>
                        D
                      </span>
                      <span>ashboard</span>
                    </span>
                  ) : (
                    <span>Dashboard</span>
                  )}
                </div>
              </button>
              <div className="block items-center justify-center py-2 px-3 rounded font-medium text-green-2 hover:text-green-4">
                <Ellipsis />
              </div>
              {isMenuOpen && (
                <li className="block items-center justify-center pb-2 px-3 rounded ">
                  <Dropdown2
                    body={["Solana", "Hedera", "Sepolia","Telos"]}
                    state={chainValue}
                    changeHandler={handleChange}
                    noBorder={false}
                  />
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center justify-center flex-row">
            <div className="flex items-center justify-center gap-2 border border-green-2 px-3 py-2 rounded mx-2">
              <Image src={rewardLogo} alt="reward Logo" />
              <span className="text-green-3 font-bold text-sm md:text-base">
                {reward && Number(reward).toFixed(2)}
              </span>
            </div>
            <div className="hidden lg:block items-center justify-center">
              <Dropdown2
                body={[ "Areon", "Solana", "Hedera", "Sepolia","Telos"]}
                state={chainValue}
                changeHandler={handleChange}
                noBorder={false}
              />
            </div>
            <button
              type="button"
              className="flex h-10 p-3 md:p-4 justify-center items-center gap-1 mr-2 md:mr-0 rounded bg-green-4 shadow-lg text-white text-sm"
              style={{ boxShadow: "4px 4px 0px 0px #0A7128" }}
              onClick={() => connectWallet()}
            >
              {walletAddress !== "Connect"
                ? walletAddress.length < 12
                  ? walletAddress
                  : walletAddress.slice(0, 6) + "..." + walletAddress.slice(-3)
                : "Connect"}
              <span>
                <Image src={walletIcon} alt="wallet logo" />
              </span>
            </button>

            <button
              type="button"
              className="md:hidden text-gray-900 dark:text-white focus:outline-none items-start"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                    color="#30B750"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                    color="#30B750"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
