import React, { useContext, useEffect, useState } from "react";
import Header from "../../../components/symbol/Header";
import {
  LendModal,
  RentModal,
  CancelModal,
  WithdrawModal,
} from "../../../components/Reusables/Modals";
import CardsSection from "../../../components/symbol/CardsSection";
import CenterBar from "../../../components/symbol/CenterBar";
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
  getAreonLendData,
  getCollectionSolidityAddressByName,
  getSepoliaLendData,
  getTelosLendData,
  getWalletLendNftByCollectionForSolidity,
  sepoliaChain,
  telosChain,
  wait,
} from "../../../services/reusableFunctions";
import { useAccount } from "wagmi";
import {
  getAssetManager,
  getAssetManagerByChain,
  getAssetsByCollection,
  getAssetsByUserAndCollection,
} from "streamnft-evm-test";
import { HederaContext } from "../../../context/HederaContext";
import { getLendNftByCollectionSolana } from "../../../util/solanaProvider";
import { SepoliaContext } from "../../../context/SepoliaContext";
import { getChainSelection } from "../../../util/common";

const lend = () => {
  const [modaltype, setModalType] = useState("");
  const [lend, setLend] = useState([]);
  const [filter, setFilter] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [cardDatatype, setCardDatatype] = useState("Owned");
  const [rightSelect, setRightSelect] = useState("Price: Low to High");
  const [search, setSearch] = useState("");
  const [leftSelect, setLeftSelect] = useState("Duration");
  const [userTransacted, setUserTransacted] = useState(false);
  const [telosNft, setTelosNft] = useState([]);
  const [dataItem, setDataItem] = useState([]);
  const wallet = useWallet();
  const router = useRouter();
  const { connection } = useConnection();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const { userNFTs, manage, collections } = useContext(SepoliaContext);
  const { isConnected, address } = useAccount();
  const { isPaired } = useContext(HederaContext);

  const chainSelection = getChainSelection(router.query.chain);

  async function getLend() {
    setLoading(true);
    if (wallet.publicKey !== null) {
      const collectionAddress = await getCollectionSolidityAddressByName(
        router.query.symbol,
        0
      );
      const lending = await getLendNftByCollectionSolana(
        wallet,
        connection,
        collectionAddress
      );
      if (
        lending.owned.length === 0 &&
        lending.listed.length === 0 &&
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
      } else if (
        lending.owned.length === 0 ||
        lending.listed.length === 0 ||
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
      } else {
        setMsg("");
      }
      setLend(lending);
      setFilter(lending);
      setLoading(false);
    } else {
      setLoading(false);
      setMsg("Connect your wallet to start lending");
    }
  }

  async function getHederaLend() {
    if (isPaired) {
      const collectionAddress = await getCollectionSolidityAddressByName(
        router.query.symbol,
        hederaMainnetChainId
      );
      if (
        typeof collectionAddress !== "undefined" &&
        JSON.parse(localStorage.getItem("hashconnectData")) &&
        JSON.parse(localStorage.getItem("hashconnectData")).pairingData[0]
      ) {
        const lending = await getWalletLendNftByCollectionForSolidity(
          collectionAddress,
          hederaMainnetChainId
        );
        if (
          lending.owned.length === 0 &&
          lending.listed.length === 0 &&
          lending.rented.length === 0
        ) {
          setMsg("You don’t own any NFT");
        } else if (
          lending.owned.length === 0 ||
          lending.listed.length === 0 ||
          lending.rented.length === 0
        ) {
          setMsg("You don’t own any NFT");
        } else {
          setMsg("");
        }
        setLend(lending);
        setFilter(lending);
        setLoading(false);
      }
    } else {
      setLend([]);
      setFilter([]);
      setLoading(false);
      setMsg("Connect your wallet to start lending");
    }
  }

  async function getSepoliaLend() {
    if (isConnected) {
      setLoading(true);
      const collectionId = await getCollectionSolidityAddressByName(
        router.query.symbol,
        chainSelection
      );

      const data = await getAssetManager(
        collectionId,
        address,
        chainSelection
      ).then((asset) => {
        return asset;
      });
      const assets = formatAssetsByDB(data);
      const filteredNFT = Object.values(userNFTs).filter(
        (item) =>
          item.contract_address.toLowerCase() === collectionId.toLowerCase()
      );

      const lending = await getSepoliaLendData(
        assets,
        filteredNFT,
        address,
        isConnected,
        collectionId
      );

      if (
        lending.owned.length === 0 &&
        lending.listed.length === 0 &&
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
        //setMsg("Mint your Test NFT");
      } else if (
        lending.owned.length === 0 ||
        lending.listed.length === 0 ||
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
      } else {
        setMsg("");
      }

      setLend(lending);
      setFilter(lending);
      setLoading(false);
    } else {
      setLoading(false);
      setMsg("Connect your wallet to start lending");
    }
  }

  async function getTelosLend() {
    if (isConnected) {
      setLoading(true);
      const collectionId = await getCollectionSolidityAddressByName(
        router.query.symbol.replace(/-/g, " "),
        chainSelection
      );
      const response = await fetch(
        `https://api.testnet.teloscan.io/v1/account/${address}/nfts`
      );

      let telosUserNFTs;
      if (!response.ok) {
        telosUserNFTs.results = [];
      }

      else telosUserNFTs = await response.json();

      let telosNft = [];

      if (telosUserNFTs && telosUserNFTs.results) {
        telosNft = telosUserNFTs.results.filter(nft => 
          nft.contract.toLowerCase() === collectionId.toLowerCase() &&
          nft.owner.toLowerCase() === address.toLowerCase()
        );
      }
      
      const data = await getAssetsByCollection(collectionId, chainSelection)
        .then((assets) => {
          return assets.filter(asset => 
            asset.token_address === collectionId &&
            asset.initializer && 
            asset.initializer.toLowerCase() === address.toLowerCase()
          );
        });
      
      // Filter telosUserNFTs.results based on conditions
      telosNft = telosNft.filter(nft => 
        !data.some(asset => 
          asset.token_address === nft.contract &&
          asset.token_id === nft.tokenId &&
          asset.state !== "INIT"
        )
      );
      const assets = formatAssetsByDB(data);
      console.log(assets);
      const lending = await getTelosLendData(
        assets,
        telosNft,
        address,
        isConnected,
        collectionId
      );

      if (
        lending.owned.length === 0 &&
        lending.listed.length === 0 &&
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
        //setMsg("Mint your Test NFT");
      } else if (
        lending.owned.length === 0 ||
        lending.listed.length === 0 ||
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
      } else {
        setMsg("");
      }

      setLend(lending);
      setFilter(lending);
      setLoading(false);
    } else {
      setLoading(false);
      setMsg("Connect your wallet to start lending");
    }
  }

  async function getAreonsLend() {
      setLoading(true);
      const walletAddress = "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa"
      let Nft = 
         [
          
          {
            "owner": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "metadata": "{\"image\": \"ipfs://QmPQdVU1riwzijhCs1Lk6CHmDo4LpmwPPLuDauY3i8gSzL\", \"attributes\": [{\"value\": \"Navy Striped Tee\", \"trait_type\": \"Clothes\"}, {\"value\": \"Aquamarine\", \"trait_type\": \"Background\"}, {\"value\": \"Bayc Hat Red\", \"trait_type\": \"Hat\"}, {\"value\": \"Dmt\", \"trait_type\": \"Fur\"}, {\"value\": \"Eyepatch\", \"trait_type\": \"Eyes\"}, {\"value\": \"Bored\", \"trait_type\": \"Mouth\"}]}",
            "minter": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "tokenId": "1",
            "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/10",
            "contract": "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
            "imageCache": null,
            "blockMinted": 280006977,
            "updated": 1706800805901,
            "transaction": "0xc3690af0ef6a9ae19b4a5a35f61769c31862f4b19c96ef25c0a6c486a183a5aa"
          },
          {
            "owner": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "metadata": "{\"image\": \"ipfs://QmeGWaFNJyVpkr1LmkKye7qfUGwK9jTRW2sMxKnMDrJKtr\", \"attributes\": [{\"value\": \"Gray\", \"trait_type\": \"Background\"}, {\"value\": \"Gray\", \"trait_type\": \"Fur\"}, {\"value\": \"Zombie\", \"trait_type\": \"Eyes\"}, {\"value\": \"Phoneme L\", \"trait_type\": \"Mouth\"}, {\"value\": \"Black T\", \"trait_type\": \"Clothes\"}, {\"value\": \"Girl's Hair Pink\", \"trait_type\": \"Hat\"}]}",
            "minter": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "tokenId": "3",
            "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/3",
            "contract": "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
            "imageCache": null,
            "blockMinted": 280145004,
            "updated": 1706802926484,
            "transaction": "0x6722215c8d718518631bd8919d3bf41a35c1869335f4fa6957e6950dc20514f4"
          },
          {
            "owner": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "metadata": "{\"image\": \"ipfs://QmeGWaFNJyVpkr1LmkKye7qfUGwK9jTRW2sMxKnMDrJKtr\", \"attributes\": [{\"value\": \"Gray\", \"trait_type\": \"Background\"}, {\"value\": \"Gray\", \"trait_type\": \"Fur\"}, {\"value\": \"Zombie\", \"trait_type\": \"Eyes\"}, {\"value\": \"Phoneme L\", \"trait_type\": \"Mouth\"}, {\"value\": \"Black T\", \"trait_type\": \"Clothes\"}, {\"value\": \"Girl's Hair Pink\", \"trait_type\": \"Hat\"}]}",
            "minter": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "tokenId": "4",
            "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/4",
            "contract": "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
            "imageCache": null,
            "blockMinted": 280145004,
            "updated": 1706802926484,
            "transaction": "0x6722215c8d718518631bd8919d3bf41a35c1869335f4fa6957e6950dc20514f4"
          },
          {
            "owner": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "metadata": "{\"image\": \"ipfs://QmeGWaFNJyVpkr1LmkKye7qfUGwK9jTRW2sMxKnMDrJKtr\", \"attributes\": [{\"value\": \"Gray\", \"trait_type\": \"Background\"}, {\"value\": \"Gray\", \"trait_type\": \"Fur\"}, {\"value\": \"Zombie\", \"trait_type\": \"Eyes\"}, {\"value\": \"Phoneme L\", \"trait_type\": \"Mouth\"}, {\"value\": \"Black T\", \"trait_type\": \"Clothes\"}, {\"value\": \"Girl's Hair Pink\", \"trait_type\": \"Hat\"}]}",
            "minter": "0x5052672dB37ad6f222B8dE61665c6BB76aCFEfaa",
            "tokenId": "5",
            "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/5",
            "contract": "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
            "imageCache": null,
            "blockMinted": 280145004,
            "updated": 1706802926484,
            "transaction": "0x6722215c8d718518631bd8919d3bf41a35c1869335f4fa6957e6950dc20514f4"
          }
        ]
        
      const collectionId = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
      const data = await getAssetsByCollection(collectionId, 462)
        .then((assets) => {
          return assets.filter(asset => 
            asset.token_address === collectionId &&
            asset.initializer && 
            asset.initializer.toLowerCase() === walletAddress.toLowerCase()
          );
        });
      
        console.log(data);
      // Filter telosUserNFTs.results based on conditions
      Nft = Nft.filter(nft => 
        !data.some(asset => 
          asset.token_address === nft.contract &&
          asset.token_id === nft.tokenId &&
          asset.state !== "INIT"
        )
      );

      const assets = formatAssetsByDB(data);
      const lending = await getAreonLendData(
        assets,
        Nft,
        walletAddress,
        isConnected,
        collectionId
      );

      if (
        lending.owned.length === 0 &&
        lending.listed.length === 0 &&
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
        //setMsg("Mint your Test NFT");
      } else if (
        lending.owned.length === 0 ||
        lending.listed.length === 0 ||
        lending.rented.length === 0
      ) {
        setMsg("You don’t own any NFT");
      } else {
        setMsg("");
      }

      setLend(lending);
      setFilter(lending);
      setLoading(false);
    } 
  
  const sort = (val) => {
    let list = [];
    if (filter.length !== 0) {
      if (val === "Price: Low to High") {
        const listed = sortarrayAsc(filter.listed, "p");
        const rented = sortarrayAsc(filter.rented, "p");
        list = { owned: filter.owned, listed: listed, rented: rented };
      } else if (val === "Price: High to Low") {
        const listed = sortarrayDes(filter.listed, "p");
        const rented = sortarrayDes(filter.rented, "p");
        list = { owned: filter.owned, listed: listed, rented: rented };
      } else if (val === "Max Duration: Low to High") {
        const listed = sortarrayAsc(filter.listed, "d");
        const rented = sortarrayAsc(filter.rented, "d");
        list = { owned: filter.owned, listed: listed, rented: rented };
      } else if (val === "Max Duration: High to Low") {
        const listed = sortarrayDes(filter.listed, "d");
        const rented = sortarrayDes(filter.rented, "d");
        list = { owned: filter.owned, listed: listed, rented: rented };
      }
      setFilter(list);
    }
  };

  const searchName = (val) => {
    let list = [];
    if (lend.length !== 0 && val.length > 0) {
      const owned = searchArray(val, lend.owned);
      const listed = searchArray(val, lend.listed);
      const rented = searchArray(val, lend.rented);
      list = { owned: owned, listed: listed, rented: rented };
      setFilter(list);
    }
    if (lend.length !== 0 && val.length === 0) {
      setFilter(lend);
    }
  };
  const filterList = (val) => {
    if (lend.length !== 0 && val === "Change") {
      const listed = filterArray(val, lend.listed);
      const rented = filterArray(val, lend.rented);
      list = { owned: filter.owned, listed: listed, rented: rented };
    }
  };

  useEffect(() => {
    if (router.query.chain === "solana") {
      getLend();
      setUserTransacted(false);
    }
    if (router.query.chain === "hedera") {
      setLoading(true);
      getHederaLend();
      setUserTransacted(false);
    }
    if (router.query.chain === "sepolia") {
      getSepoliaLend();
    }
    if (router.query.chain === "telos") {
      setLoading(true);
      getTelosLend();
      // setUserTransacted(false);
    }
    if(router.query.chain === "areon"){
      setLoading(true);
      getAreonsLend();
    }
  }, [
    router.query.chain,
    wallet,
    isPaired,
    userTransacted,
    telosNft,
    isConnected,
    userNFTs,
    manage
  ]);

  useEffect(() => {
   
  }, []);

  useEffect(() => {
    if (cardDatatype === "Owned") {
      setCardsData(filter.owned || []);
      Mixpanel.track("home_rentmkt_collection_lend_owned");
    } else if (cardDatatype === "Listed") {
      setCardsData(filter.listed || []);
      Mixpanel.track("home_rentmkt_collection_lend_listed");
    } else if (cardDatatype === "Rented") {
      setCardsData(filter.rented || []);
      Mixpanel.track("home_rentmkt_collection_lend_rented");
    } else return;
  }, [lend, filter, cardDatatype]);

  useEffect(() => {
    sort(rightSelect);
    Mixpanel.track("home_rentmkt_collection_lend_sort");
  }, [lend, rightSelect]);

  useEffect(() => {
    searchName(search);
    Mixpanel.track("home_rentmkt_collection_lend_search");
  }, [lend, search]);

  useEffect(() => {
    filterList(leftSelect);
    Mixpanel.track("home_rentmkt_collection_lend_filter");
  }, [lend, leftSelect]);

  return (
    <>
      <div className="min-h-screen">
        <Header userTransacted={userTransacted} />
        <CenterBar
          selectBody={["Owned", "Listed", "Rented"]}
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
          loading={loading}
        />
        {modaltype === "Lend" ? (
          <LendModal
            cardsData={dataItem}
            setUserTransacted={setUserTransacted}
          />
        ) : modaltype === "Rent" ? (
          <RentModal
            cardsData={dataItem}
            setUserTransacted={setUserTransacted}
          />
        ) : modaltype === "Cancel" ? (
          <CancelModal
            cardsData={dataItem}
            setUserTransacted={setUserTransacted}
          />
        ) : modaltype === "Withdraw" ? (
          <WithdrawModal
            cardsData={dataItem}
            setUserTransacted={setUserTransacted}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default lend;
