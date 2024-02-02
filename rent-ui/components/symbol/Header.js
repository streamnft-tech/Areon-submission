import React, { useEffect, useState, useContext } from "react";
import { Wrapper } from "../../styles/symbol/header.styles";
import { useRouter } from "next/router";
import discordIcon from "../../public/images/discord.svg";
import twitterIcon from "../../public/images/twitter.svg";
import {
  getAvailabilityCount,
  getHederaCollectionArray,
  getSolanaCollectionArray,
} from "../../util/common";
import { SepoliaContext } from "../../context/SepoliaContext";
import Image from "next/image";
import { wait } from "../../services/reusableFunctions";

const Header = ({ data, userTransacted }) => {
  const [collection, setCollection] = useState({
    image: "",
    name: "",
    description: "",
    totalList: "",
    totalRent: "",
  });
  const [availableList, setAvailableList] = useState("0");
  const router = useRouter();
  const { manage } = useContext(SepoliaContext);

  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleViewMore = () => {
    setShowFullDescription(!showFullDescription);
  };

  const dummyDescription =
    "Mini Royale: Nations is a browser-based first-person-shooter set on top of a land strategy game. Players can earn mintable items through Battle Pass and Quests, join or create Clans to participate in Clan Wars, fuse weapons and characters for ultra rare skins, and more.Mini Royale: Nations is a browser-based first-person-shooter set on top of a land strategy game. Players can earn mintable items through Battle Pass and Quests, join or create Clans to participate in Clan Wars, fuse weapons and characters for ultra rare skins, and more.";

  const symbol = router.query;
  const { collections, manageCollection, setManageCollection } =
    useContext(SepoliaContext);

  async function getcollection() {
    if (router.query.chain === "solana") {
      const data = await getSolanaCollectionArray();

      if (data !== "undefined" && data) {
        if (typeof symbol.symbol !== "undefined") {
          var result = data.filter((obj) => {
            const modifyObjName = obj.name.toLowerCase().replace(/[\s-]/g, "");
            const modifySymbol = symbol.symbol
              .toLowerCase()
              .replace(/[\s-]/g, "");

            return modifyObjName === modifySymbol;
          });
          if (result.length > 0 && typeof result[0] !== "undefined") {
            setCollection(result[0]);
            const count = await getAvailabilityCount(result[0].token_address);
            if (Number(count)) {
              setAvailableList(Number(count));
            }
          } else {
            router.push("/404");
          }
        }
      }
    }

    if (router.query.chain === "hedera") {
      const data = await getHederaCollectionArray();
      if (data !== "undefined" && data) {
        if (typeof symbol.symbol !== "undefined") {
          var result = data.filter((obj) => {
            const modifyObjName = obj.name.toLowerCase().replace(/[\s-]/g, "");
            const modifySymbol = symbol.symbol
              .toLowerCase()
              .replace(/[\s-]/g, "");

            return modifyObjName === modifySymbol;
          });

          if (result.length > 0 && typeof result[0] !== "undefined") {
            setCollection(result[0]);
          } else {
            router.push("/");
          }
        }
      }
    }

    if (router.query.chain === "sepolia") {
      if (collections.length == 0) {
        setManageCollection(!manageCollection);
      }
      const _collection = collections.filter((obj) => {
        const modifyObjName = obj.name.toLowerCase().replace(/[\s-]/g, "");
        const modifySymbol = symbol.symbol.toLowerCase().replace(/[\s-]/g, "");

        return modifyObjName === modifySymbol;
      });
      if (_collection === "undefined" || _collection.length === 0) {
        setManageCollection(!manageCollection);
      } else {
        setCollection(_collection[0]);
      }
    }

    if (router.query.chain === "telos" || router.query.chain === "areon") {
      if (collections.length == 0) {
        setManageCollection(!manageCollection);
      }
      const _collection = collections.filter((obj) => {
        const modifyObjName = obj.name.toLowerCase().replace(/[\s-]/g, "");
        const modifySymbol = symbol.symbol.toLowerCase().replace(/[\s-]/g, "");

        return modifyObjName === modifySymbol;
      });
      if (_collection === "undefined" || _collection.length === 0) {
        setManageCollection(!manageCollection);
      } else {
        setCollection(_collection[0]);
      }
    }
  }
  

  useEffect(() => {
    if (!data) {
      getcollection();
    } else {
      setCollection(data);
    }
  }, [symbol, data, router.query.chain, userTransacted, collections, manage]);

  return (
    <Wrapper>
      <div className="inner-wrapper !flex !items-center">
        <div className="w-200">
        <Image
          src={collection?.image_url ? collection.image_url : ""}
          alt="Collection Image"
          width={200}
          height={70}
          className="items-center"
        />
        </div>
        <div className="header-contents pt-[4rem] md:pt-[1rem] ">
          <div className="title-line-with-icons gap-x-2 space-x-2">
            <h1>{collection.name}</h1>
            <div className="icons-wrapper">
              <div className="icon-wrapper">
                <Image src={twitterIcon} alt="" />
              </div>
              <div className="icon-wrapper">
                <Image src={discordIcon} alt="" />
              </div>
            </div>
          </div>
          <p>
            {showFullDescription || collection.description.length <= 136
              ? collection.description
              : `${collection.description.slice(0, 316)}... `}
            {collection.description.length > 316 && (
              <span
                className="view-more cursor-pointer"
                onClick={handleViewMore}
              >
                {showFullDescription ? "View Less" : "View More"}
              </span>
            )}
          </p> 
          <div className="details-wrapper !mb-5 !mt-0 !pt-0">
            <div className="detail font-numans">
              <h5>Floor Price</h5>
              {router.query.chain === "solana" ? (
                <h4>{collection.floor} SOL </h4>
              ) : router.query.chain === "hedera" ? (
                <h4>{collection.floor} HBAR </h4>
              ) : router.query.chain === "telos" ? (
                <h4>{collection.floor} TLOS </h4>)
                : router.query.chain === "areon" ? (
                  <h4>{collection.floor} TAREA </h4>)
                : (<h4>{collection.floor} ETH </h4>
              )}
            </div>
            <div className="seperator"></div>
            <div className="detail">
              <h5 className="whitespace-nowrap">Listed NFT</h5>
              <h4>
                {typeof availableList === "number"
                  ? availableList
                  : collection.active_list}
              </h4>
            </div>
            <div className="seperator"></div>
            <div className="detail">
              <h5 className="whitespace-nowrap">Total Rentals</h5>
              <h4>{collection.active_rent}</h4>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Header;
