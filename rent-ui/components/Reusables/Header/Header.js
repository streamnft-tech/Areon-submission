import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getUserRewards } from "../../../services";
import Navbar from "./Navbar";
import HeaderNavigation from "./HeaderNavigation";


// ... (previous imports)

const Header = () => {
  const [selectedOption, setSelectedOption] = useState("My Assets");
  const router = useRouter();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [reward, setReward] = useState(0);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  const getRewardValue = async () => {
    const result = await getUserRewards(wallet, connection);

    if (typeof result !== "undefined") {
      setReward(result);
    }
  };

  useEffect(() => {
    getRewardValue();

    setSelectedOption(
      router.pathname.includes("lend")
        ? "My Assets"
        : router.pathname.includes("rentals")
        ? "My Rentals"
        : "Marketplace"
    );
  }, [selectedOption, router.pathname]);

  useEffect(() => {
    getRewardValue();
  }, [wallet]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.body.addEventListener("click", handleClickOutside);

    return () => {
      document.body.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
           <Navbar/>
      {router.query.chain && router.query.symbol && <HeaderNavigation />}
      
    </>
  );
};

export default Header;
