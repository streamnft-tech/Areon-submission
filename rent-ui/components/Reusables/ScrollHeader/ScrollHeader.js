import React, { useContext, useEffect, useState } from "react";
import SearchBar from "../SearchBar/SearchBar";
import { ImageBlock } from "./ScrollHeaderStyles";
import { useRouter } from "next/router";
import { ScrollHeaderContext } from "../../../context/ScrollHeaderContext";
import { Mixpanel } from "../../../util/mixpanel";
import {
  getHederaCollectionArray,
  getSolanaCollectionArray,
  url,
} from "../../../util/common";
import { SepoliaContext } from "../../../context/SepoliaContext";

const ScrollHeader = () => {
  const [searchValue, setSearchValue] = useState("");

  const { selectedNft, setSelectedNft } = useContext(ScrollHeaderContext);

  const [collection, setCollection] = useState([]);
  const router = useRouter();

  const { symbol } = router.query;

  //img url
  const [imageUrl, setImageUrl] = useState([]);

  useEffect(() => {
    const fetchImgUrl = async () => {
      try {
        const response = await fetch(
          `${url}/all/chain`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setImageUrl(data);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImgUrl();
  }, []);

  async function getcollection() {
    //const data = await getAllCollection(wallet, connection);
    const data = await getSolanaCollectionArray();
    if (Object.keys(data).length > 0) {
      setCollection(data);
    }
  }

  async function getHederaCollections() {
    const data = await getHederaCollectionArray();

    if (data !== "undefined" && data) {
      data.filter((ele) => ele !== undefined);
      setCollection(data);
    }
  }
  const { collections } = useContext(SepoliaContext);

  useEffect(() => {
    if (router.query.chain === "solana") {
      getcollection();
    }
    if (router.query.chain === "hedera") {
      getHederaCollections();
    }
    if (router.query.chain === "sepolia") {
      setCollection(collections);
    }
    if (router.query.chain === "telos" || router.query.chain === "areon") {
      setCollection(collections);
    }
  }, [router.query.chain, collections]);

  useEffect(() => {
    if (symbol === undefined) {
      setSelectedNft("all");
    } else {
      setSelectedNft(symbol);
    }
  }, [symbol]);

  useEffect(() => {
    if (selectedNft !== "all") {
      setSelectedNft(symbol);
    }
  }, [selectedNft]);
 

  function modify(str) {
    return str.replace(/\s+/g, "-");
  }
  


  return (
    <div
      className="flex flex-col md:flex-row justify-between items-center px-[2.7rem] w-[100%] pt-3 gap-0 md:gap-3"
      style={{ marginTop: selectedNft === "all" ? "15px" : "" }}
    >
      <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-4">
        <div className="flex flex-row flex-wrap">
          {selectedNft === "all" && (
            <div className="important_chain h-12 flex-col items-start justify-start gap-1 w-76">
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px #292929 solid",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  display: "inline-flex",
                }}
              >
                <div
                  style={{
                    width: "68px",
                    alignSelf: "stretch",
                    paddingLeft: "12px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    background: "rgba(137.59, 136.61, 136.61, 0.36)",
                    borderRight: "1px #3D3D3D solid",
                    justifyContent: "flex-center",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontSize: "12px",
                      fontFamily: "Numans",
                      fontWeight: 400,
                      wordWrap: "break-word",
                    }}
                    className="pr-2"
                  >
                    Chains
                  </div>
                </div>
                {imageUrl.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      height: "48px",
                      padding: "12px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <img
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "100%",
                        border: "2px rgba(9, 42, 19, 0.5) solid",
                        padding: "2px",
                      }}
                      src={url}
                      alt={`Chain ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <SearchBar
          className="search_bar"
          state={searchValue}
          changeHandler={setSearchValue}
          placeholder="Search for collection"
        />
      </div>

      <div className=" ml-3 md:ml-0 flex flex-row flex-wrap md:flex-nowrap my-2 gap-3 ">
        <div>
          <div className="scroll-block flex flex-row flex-wrap md:flex-nowrap items-start justify-center">
            {collection?.map((item) => {
              const formattedName = item.name
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")

              let defaultPath = "/myassets";
              if (router.pathname.includes("marketplace")) {
                defaultPath = "/marketplace";
              } else if (router.pathname.includes("rentals")) {
                defaultPath = "/rentals";
              }


              return (
                <ImageBlock  
                onClick={() => {
                  setSelectedNft(item.name);
                  router.push(`/${router.query.chain}/${formattedName}${defaultPath}`);
                }}
                  selected={selectedNft === modify(item.name)}
                  key={item.id}
                  className={`flex`}
                >
                  <div>
                    <img key={item.id} src={item.image_url} />
                  </div>
                </ImageBlock>
              );
            })}
          </div>
        </div>
        <div className="inline-block self-stretch bg-[#C0F2CB] border-[#C0F2CB] border-[1px] opacity-20"></div>
        <ImageBlock
          selected={selectedNft === "all"}
          onClick={() => {
            setSelectedNft("all");
            router.push(`/`);
            Mixpanel.track("home_rentmkt_list_project");
          }}
        >
          <div className="all-block-section">
            <div className="all-block-bg ">
              {collection?.slice(0, 4).map((item, index) => (
                <img
                  key={index}
                  src={item.image_url}
                  className="rounded-full"
                />
              ))}
            </div>
            <h5>All</h5>
          </div>
        </ImageBlock>
      </div>
    </div>
  );
};

export default ScrollHeader;
