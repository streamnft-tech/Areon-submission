import React, { useState, useEffect, useContext } from "react";
import Header from "../../../components/symbol/Header";
import CardsSection from "../../../components/symbol/CardsSection";
import { WithdrawModal } from "../../../components/Reusables/Modals";
import CenterBar from "../../../components/symbol/CenterBar";
import { getCollectionIdByName } from "../../../services";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { useRouter } from "next/router";
import {
  filterArray,
  hederaMainnetChainId,
  searchArray,
  sortarrayAsc,
  sortarrayDes,
} from "../../../util/common";
import { Mixpanel } from "../../../util/mixpanel";
import {
  formatAssetsByDB,
  getCollectionSolidityAddressByName,
  getSepolisRentData,
  getTelosMyRentalsData,
  getUsersRentedNftByCollectionForSolidity,
  sepoliaChain,
  telosChain,
} from "../../../services/reusableFunctions";
import { useAccount } from "wagmi";
import { SepoliaContext } from "../../../context/SepoliaContext";
import { getAssetsByCollection } from "streamnft-evm-test";
import { HederaContext } from "../../../context/HederaContext";
import { getRentalNftByCollectionSolana } from "../../../util/solanaProvider";
import { getChainSelection } from "../../../util/common";

const rent = () => {
  const [modaltype, setModalType] = useState("");
  const [rent, setRent] = useState([]);
  const [filter, setFilter] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [cardDatatype, setCardDatatype] = useState("Rented");
  const [rightSelect, setRightSelect] = useState("Price: Low to High");
  const [search, setSearch] = useState("");
  const [leftSelect, setLeftSelect] = useState("Duration");
  const [dataItem, setDataItem] = useState([]);
  const [msg, setMsg] = useState("");
  const [disable, setDisable] = useState(false);
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { userNFTs, manage } = useContext(SepoliaContext);
  const { isPaired } = useContext(HederaContext);
  const [userTransacted, setUserTransacted] = useState(false);
  const chainSelection = getChainSelection(router.query.chain);

  async function getSepoliaRent() {
    if (isConnected) {
      setLoading(true);
      const collectionId = await getCollectionSolidityAddressByName(
        router.query.symbol.replace(/-/g, " "),
        chainSelection
      );

      const data = await getAssetsByCollection(
        collectionId,
        chainSelection
      ).then((assets) => {
        return assets.filter(
          (asset) =>
            asset.token_address === collectionId &&
            asset.rentee &&
            asset.rentee.toLowerCase() === address.toLowerCase()
        );
      });
      console.log(data)
      if (data.length > 0) {
        const assets = formatAssetsByDB(data);
        if (typeof collectionId !== "undefined") {
          const renting = await getTelosMyRentalsData(address, assets);
          setRent(renting);
          setFilter(renting);
          setLoading(false);

          if (renting.rented.length === 0) {
            setMsg("You don’t have any rented NFT");
          } else {
            setMsg("");
          }
          setDisable(false);
          setLoading(false);
        } else {
          setMsg("You don’t have any rented NFT");
          setLoading(false);
        }
      } else {
        setLoading(false);
        setMsg("You don’t have any rented NFT");
      }
    } else {
      setMsg("Connect your wallet to see your rentals");
      setLoading(false);
    }
  }

  async function getAreonRent() {
      setLoading(true);
      const collectionId = await getCollectionSolidityAddressByName(
        router.query.symbol.replace(/-/g, " "),
        chainSelection
      );

      const walletAddress = "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa"
      const data = await getAssetsByCollection(
        collectionId,
        chainSelection
      ).then((assets) => {
        return assets.filter(
          (asset) =>
            asset.token_address === collectionId &&
            asset.rentee &&
            asset.rentee.toLowerCase() === walletAddress.toLowerCase()
        );
      });
      console.log(data)
      if (data.length > 0) {
        const assets = formatAssetsByDB(data);
        if (typeof collectionId !== "undefined") {
          const renting = await getTelosMyRentalsData(walletAddress, assets);
          setRent(renting);
          setFilter(renting);
          setLoading(false);

          if (renting.rented.length === 0) {
            setMsg("You don’t have any rented NFT");
          } else {
            setMsg("");
          }
          setDisable(false);
          setLoading(false);
        } else {
          setMsg("You don’t have any rented NFT");
          setLoading(false);
        }
      } else {
        setLoading(false);
        setMsg("You don’t have any rented NFT");
      }
  }
  async function getTelosRent() {
    setLoading(true);
    const collectionId = await getCollectionSolidityAddressByName(
      router.query.symbol,
      chainSelection
    );
    const filteredNFT = userNFTs.filter(
      (item) =>
        item.contract_address.toLowerCase() === collectionId.toLowerCase()
    );
    const data = await getAssetsByCollection(collectionId, chainSelection).then(
      (asset) => {
        return asset;
      }
    );
    const assets = formatAssetsByDB(data);
    if (typeof collectionId !== "undefined" && data.length > 0) {
      const renting = await getSepolisRentData(
        collectionId,
        filteredNFT,
        address,
        isConnected,
        assets
      );
      setRent(renting);
      setFilter(renting);
      setLoading(false);

      if (renting.rented.length === 0) {
        setMsg("You don’t have any rented NFT");
      } else {
        setMsg("");
      }
      setDisable(false);
      setLoading(false);
    }
  }

  async function getHederaRent() {
    const collectionId = await getCollectionSolidityAddressByName(
      router.query.symbol,
      hederaMainnetChainId
    );
    if (typeof collectionId !== "undefined") {
      const renting = await getUsersRentedNftByCollectionForSolidity(
        collectionId,
        hederaMainnetChainId,
        isPaired
      );
      setRent(renting);
      setFilter(renting);
      setLoading(false);
      if (renting.rented.length === 0) {
        if (!isPaired) {
          setMsg("Connect your wallet to see your rentals");
          setDisable(true);
        } else {
          setMsg("You don’t have any rented NFT");
        }
      } else {
        setMsg("");
      }
      setDisable(false);
      setLoading(false);
    }
  }

  async function getRent() {
    setLoading(true);

    const collectionId = await getCollectionIdByName(
      wallet,
      connection,
      router.query.symbol
    );
    if (typeof collectionId !== "undefined") {
      const renting = await getRentalNftByCollectionSolana(
        wallet,
        connection,
        collectionId
      );
      setRent(renting);
      setFilter(renting);
      setLoading(false);

      if (wallet.publicKey === null) {
        setMsg("Connect your wallet to start renting");
        setDisable(true);
      } else {
        if (renting.rented.length === 0) {
          setMsg("You don’t have any rented NFT");
        } else {
          setMsg("1");
        }
        setDisable(false);
        setLoading(false);
      }
    }
  }

  const sort = (val) => {
    let list = [];
    if (filter.length !== 0) {
      if (val === "Price: Low to High") {
        const rented = sortarrayAsc(filter.rented, "p");
        list = { rented };
      } else if (val === "Price: High to Low") {
        const rented = sortarrayDes(filter.rented, "p");
        list = { rented };
      } else if (val === "Max Duration: Low to High") {
        const rented = sortarrayAsc(filter.rented, "d");
        list = { rented };
      } else if (val === "Max Duration: High to Low") {
        const rented = sortarrayDes(filter.rented, "d");
        list = { rented };
      }
      setFilter(list);
    }
  };

  const searchName = (val) => {
    let list = [];
    if (rent.length !== 0 && val.length > 0) {
      const rented = searchArray(val, rent.rented);
      list = { rented };

      setFilter(list);
    }
    if (rent.length !== 0 && val.length === 0) {
      setFilter(rent);
    }
  };

  const filterList = (val) => {
    let list = [];
    if (rent.length !== 0 && val === "Change") {
      const rented = filterArray(val, rent.rented);
      list = { rented: rented };
      setFilter(list);
    }
  };
  useEffect(() => {
    if (router.query.chain === "solana") {
      getRent();
    }
    if (router.query.chain === "hedera") {
      setLoading(true);
      getHederaRent();
      setUserTransacted(false);
    }
    if (router.query.chain === "sepolia" || router.query.chain === "telos") {
      getSepoliaRent();
    }
    if(router.query.chain === "areon"){
      getAreonRent();
    }
  }, [wallet, userNFTs, isConnected, userTransacted, isPaired, manage]);

  useEffect(() => {
    setCardsData(filter.rented);
  }, [rent, cardDatatype, filter]);

  useEffect(() => {
    sort(rightSelect);
    Mixpanel.track("home_rentmkt_collection_rent_sort");
  }, [rent, rightSelect]);

  useEffect(() => {
    searchName(search);
    Mixpanel.track("home_rentmkt_collection_rent_search");
  }, [rent, search]);

  useEffect(() => {
    filterList(leftSelect);
    Mixpanel.track("home_rentmkt_collection_rent_filter");
  }, [rent, leftSelect]);

  return (
    <>
      <div className="min-h-screen">
        <Header />
        <CenterBar
          showCenterBar={false}
          selectBody={["Rented"]}
          cardDatatype={cardDatatype}
          setCardDatatype={setCardDatatype}
          rightSelect={rightSelect}
          setRightSelect={setRightSelect}
          search={search}
          setSearch={setSearch}
          leftSelect={leftSelect}
          setLeftSelect={setLeftSelect}
        />
        <CardsSection
          setModalType={setModalType}
          setDataItem={setDataItem}
          cardsData={cardsData}
          cardDatatype={cardDatatype}
          msg={msg}
          disable={disable}
          loading={loading}
        />
        {modaltype === "Withdraw" && (
          <WithdrawModal
            cardsData={dataItem}
            setUserTransacted={setUserTransacted}
          />
        )}
      </div>
    </>
  );
};

export default rent;
