import { createContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getCollections } from "streamnft-evm-test";
import { CovalentClient } from "@covalenthq/client-sdk";
import { sepoliaChain, telosChain } from "../services/reusableFunctions";
export const SepoliaContext = createContext();
import { useRouter } from "next/router";

const SepoliaContextWrapper = ({ children }) => {
  const [collections, setCollections] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const { isConnected, address } = useAccount();
  const [manage, setManage] = useState(true);
  const [manageCollection, setManageCollection] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getCollectionsData() {
      if (!router.query.chain) {
        return;
      }

      let data = [];

      if (router.query.chain === "sepolia") {
        data = await getCollections(sepoliaChain);
      } else if (router.query.chain === "telos") {
        data = await getCollections(telosChain);
      }
      else if (router.query.chain === "areon") {
        data = await getCollections(462);

      }

      if (data) {
        data.map((item, index) => {
          item.image = item.image_url;
          item.list = item.active_list;
          item.rent = item.active_rent;
          return item;
        });
      }
      setCollections(data);
    }

    getCollectionsData();
  }, [router.query.chain]);

  useEffect(() => {
    async function getNFTs() {
      if (isConnected) {
        if (router.query.chain === "sepolia") {
          const client = new CovalentClient("cqt_rQc6CtGgxppwj7tdQJJhwTXRXwkV");
          client.NftService.getNftsForAddress("eth-sepolia", address, {}).then(
            (resp) => {
              setUserNFTs(resp.data.items);
            }
          );
        } else if (router.query.chain === "telos") {
          try {
            const response = await fetch(
              `https://api.testnet.teloscan.io/v1/account/${address}/nfts`
            );

            if (!response.ok) {
              throw new Error(`response error telos: ${response.status}`);
            }

            const telosUserNFTs = await response.json();
            setUserNFTs(telosUserNFTs);
          } catch (error) {
            console.error("Error in telos:", error);
          }
        }
      }
    }

    getNFTs();
  }, [isConnected, manage, router.query.chain, address, collections]);

  return (
    <SepoliaContext.Provider
      value={{
        collections,
        setCollections,
        userNFTs,
        manage,
        setManage,
        setManageCollection,
        manageCollection,
      }}
    >
      {children}
    </SepoliaContext.Provider>
  );
};
export default SepoliaContextWrapper;
