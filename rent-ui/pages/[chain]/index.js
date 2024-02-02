import React, { Fragment, useEffect, useState, useContext } from "react";
import { Wrapper } from "../../styles/home/home.styles";
import { useRouter } from "next/router";
import AllNftsView from "../../components/Reusables/AllNftsView/AllNftsView"
import { Mixpanel } from "../../util/mixpanel";
import {
  getAvailabilityCount,
  getHederaCollectionArray,
  getSolanaCollectionArray,
} from "../../util/common";
import { SepoliaContext } from "../../context/SepoliaContext";
const index = () => {
  const router = useRouter();

  const [collection, setCollection] = useState([]);
  const [telosCollection, setTelosCollection] = useState([]);
  const [availableList, setAvailableList] = useState("0");


  useEffect(() => {
    const { chain } = router.query;
    const selectedChain = localStorage.getItem('selectedChain');


    if (chain) {
      localStorage.setItem('selectedChain', chain);
      router.push(`/${chain}`);
    } else if (!selectedChain && router.pathname === '/') {
      router.push('/hedera');
    }

    const handleUnload = () => {
      localStorage.removeItem('selectedChain');
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, [router.query.chain]);
  
  
  
  async function getcollection() {
    const data = await getSolanaCollectionArray();
    if (data !== "undefined" && data) {
      setCollection(data);
      const count = await getAvailabilityCount(data[0].token_address);
      if (Number(count)) {
        setAvailableList(Number(count));
      }
    }
  }

  async function getHederaCollections() {
    const data = await getHederaCollectionArray();

    if (data !== "undefined" && data) {
      setCollection(data);

    }
  }

  const { collections } = useContext(SepoliaContext);
  useEffect(() => {
    if (router.query.chain === "solana") {
      getcollection();
    }
    else if (router.query.chain === "hedera") {
      getHederaCollections();
    }
    else {
      setCollection(collections);
    }

    Mixpanel.track("On Homepage");
  }, [router.query.chain, collections]);




  return (
    <Fragment>
      <Wrapper>
        <AllNftsView collection={collection} availableList={availableList} />
      </Wrapper>
    </Fragment>
  );
};

export default index;
