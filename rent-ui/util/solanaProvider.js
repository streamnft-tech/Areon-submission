import axios from "axios";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  web3,
  BN,
  BorshCoder,
} from "@project-serum/anchor";
import { IDL } from "../types/streammoney_nft.ts";
import { programs } from "@metaplex/js";
import {
  Metadata,
  MasterEdition,
} from "@metaplex-foundation/mpl-token-metadata";
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import { AccountId } from "@hashgraph/sdk";
import { hashconnect } from "../util/hashConnectProvider";
import {
  calculateProfit,
  expiryTime,
  getDuration,
  getMinutes,
  getRate,
  getRatePerHour,
  getSeconds,
  getTimeForCard,
  scaleConvertion,
  timeString,
  getCardMaxTime,
  totalTimeLeft,
  getMaxTimeInSecond,
  getHederaCollectionArray,
  hederaMainnetChainId,
  getSolanaCollectionArray,
} from "../util/common";
import { toast } from "react-toastify";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { createAssociatedTokenAccount } from "@solana/spl-token";
import { getAssetManagersByToken } from "test-multichain-sdk";
import {
  getAssetManagers,
  getCollections,
  getSigner,
  getURL,
  getWalletSigner,
  getProvider as getProviderEVM,
} from "streamnft-evm-test";
import {
  checkPairing,
  getNFTImageURI,
  signerGet,
  getUserNftByCollection,
} from "../util/hashConnectProvider";
import { ethers, formatEther } from "ethers";
import BigNumber from "bignumber.js";
import { PROGRAM_ID } from "streamnft-sol/build/constants.js";

async function getProvider(wallet) {
  try {
    const opts = {
      preflightCommitment: "processed",
    };
    const network = "https://api.devnet.solana.com/";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      wallet,
      opts.preflightCommitment
    );
    return provider;
  } catch (e) {
    console.error(e);
    toast.error(e.message);
  }
}

const getProgramId = () => {
  return new PublicKey(PROGRAM_ID);
};

const getMetaplexMetadata = async (id, connection) => {
  const state = await programs.metadata.Metadata.findByMint(connection, id);

  // Get the metadata for the NFT
  //const metadata = await Metadata.load(connection, metadataAddress);

  return state;
};

const getData = async (connection, token) => {
  try {
    let mintPubkey = new PublicKey(token);
    const tokenmeta = await programs.metadata.Metadata.findByMint(
      connection,
      mintPubkey
    );
    if (typeof token !== "undefined" && typeof tokenmeta !== "undefined") {
      return tokenmeta.data;
    }
    return undefined;
  } catch (e) {
    //console.error(e);
  }
};

const getMetaData = async (uri) => {
  if (!uri.includes("thirdweb")) {
    const response = await fetch(uri);
    const jsonData = await response.json();

    let imageUri = jsonData.image; // Changed variable name from uri to imageUri
    if (imageUri && imageUri.includes("thirdweb")) {
      imageUri = imageUri.replace(
        "https://ipfs.thirdwebcdn.com/ipfs/",
        "https://ipfs.io/ipfs/"
      );
    }
    jsonData.image = imageUri;
    return jsonData;
  }
  return null;
};

export const getLendNftByCollectionSolana = async (wallet, connection, id) => {
  var listings = [];
  let listedNFT = [];
  let borrowedNFT = [];
  const allEscrowAsset = await getAssetManagersByToken(id, 0);
  const listingNft = await getParsedNftAccountsByOwner({
    publicAddress: wallet.publicKey.toBase58(),
    connection,
    sanitize: true,
  });
  var available = 0;

  // var id = "OTHER";
  // if ("OTHER" !== name) {
  //}
  if (listingNft.length) {
    for (let i in listingNft) {
      try {
        const meta = await getMetaplexMetadata(listingNft[i].mint, connection);
        if ("OTHER" !== id) {
          if (
            typeof meta !== "undefined" &&
            typeof meta.data.collection !== "undefined" &&
            meta.data.collection &&
            meta.data.collection.key &&
            meta.data.collection.key === id
          ) {
            if (listingNft[i].data.sellerFeeBasisPoints !== 0) {
              // Find if the mint exists in the allEscrow array
              const escrowMatch = allEscrowAsset.find(
                (escrow) => escrow.tokenId === listingNft[i].mint
              );

              if (escrowMatch) {
                if (escrowMatch.state === "INIT") {
                  // If there's a match in the allEscrow array
                  available++;
                  listingNft[i] = {
                    ...listingNft[i],
                    value: "Owner",
                    buttonValue: "Lend",
                  };
                  listings.push(listingNft[i]);
                }
              } else {
                // If there's no match in the allEscrow array
                available++;
                listingNft[i] = {
                  ...listingNft[i],
                  value: "Owned",
                  buttonValue: "Lend",
                };
                listings.push(listingNft[i]);
              }
            }
          }
        } else {
          if (listingNft[i].data.sellerFeeBasisPoints !== 0) {
            listingNft[i] = {
              ...listingNft[i],
              value: "Owner",
              buttonValue: "Lend",
            };
            listings.push(listingNft[i]);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      }
    }
  }

  for (let i in listings) {
    if (listings[i].data.uri.includes("thirdweb")) {
      listings[i].data.uri = listings[i].data.uri.replace(
        "https://ipfs.thirdwebcdn.com/ipfs/",
        "https://hashpack.b-cdn.net/ipfs/"
      );
    }
    const metaDataSolana = await getMetaData(listings[i].data.uri);
    let image = metaDataSolana.image;
    if (image && image.includes("thirdweb")) {
      image = image.replace(
        "https://ipfs.thirdwebcdn.com/ipfs/",
        "https://hashpack.b-cdn.net/ipfs/"
      );
      metaDataSolana.image = image;
    }
    listings[i] = {
      ...metaDataSolana,
      value: listings[i].value,
      buttonValue: listings[i].buttonValue,
      id: listings[i].mint,
      metaDataLink: listings[i].data.uri,
      owner: wallet.publicKey.toBase58(),
      explorerLink: `https://solscan.io/token/${listings[i].mint}?cluster=devnet`,
      magiceden: `https://magiceden.io/item-details/${listings[i].mint}`,
      totalAvailable: available,
      durationType: "",
      token: id,
    };
  }
  /*if ("OTHER" === symbol) {
      return { owned: listings, listed: [], rented: [] };
    }*/
  try {
    const allListed =
      typeof allEscrowAsset !== "undefined"
        ? allEscrowAsset.filter(
            (a) => a.initializer === wallet.publicKey.toBase58()
          )
        : [];
    var listed = [];
    var allBorrowed = [];
    for (let i in allListed) {
      if (
        allListed[i].state === "STALE" ||
        allListed[i].state === "STALEANDLOAN"
      ) {
        allListed[i] = {
          ...allListed[i],
          value: "Listed",
          buttonValue: "Cancel",
        };
        listed.push(allListed[i]);
      }
      if (
        allListed[i].state === "RENT" ||
        allListed[i].state === "RENTANDLOAN"
      ) {
        allListed[i] = {
          ...allListed[i],
          value: "Rented",
          buttonValue: "Withdraw",
        };
        allBorrowed.push(allListed[i]);
      }
    }

    for (let k = 0; k < listed.length; k++) {
      const listedNFTElement = listed[k];

      let cardTime = "";
      let type = "Fixed Duration : " + cardTime;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let timeLeft = "";
      let rentType = "Fixed";

      cardTime = getCardMaxTime(listedNFTElement.rentState.validityExpiry);
      if (listedNFTElement.rentState.isFixed) {
        cardTime = getTimeForCard(listedNFTElement.rentState.fixedMinutes * 60);
      }

      let dataSolana;
      if (
        listedNFTElement.name === null ||
        typeof listedNFTElement.name === "undefined"
      ) {
        dataSolana = await getData(connection, listed[k].tokenId);
        if (dataSolana.data.uri.includes("thirdweb")) {
          dataSolana.data.uri = dataSolana.data.uri.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }
        const metaDataSolana = await getMetaData(dataSolana.data.uri);
        let image = metaDataSolana.image;
        if (image && image.includes("thirdweb")) {
          image = image.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          metaDataSolana.image = image;
        }
        listed[k].name = metaDataSolana.name;
        listed[k].image = metaDataSolana.image;
      }
      //if (dataSolana) {
      if (
        listedNFTElement.tokenAddress &&
        listedNFTElement.tokenAddress === id
      ) {
        if (!listed[k].isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }

        minTimeString = timeString(60);
        maxTimeString = timeString(
          listedNFTElement.rentState.fixedMinutes * 60
        );
        type = "Fixed Duration : " + cardTime;
        if (!listedNFTElement.rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }
        minTimeString = timeString(60);
        maxTimeString = timeString(
          listedNFTElement.rentState.fixedMinutes * 60
        );
        profit = listedNFTElement.profit / LAMPORTS_PER_SOL;
        if (!listedNFTElement.rentState.isFixed) {
          duration = getCardMaxTime(listedNFTElement.rentState.validityExpiry);
        } else {
          duration = getDuration(listedNFTElement.rentState.fixedMinutes * 60);
        }
        ratePerHour = getRatePerHour(
          listedNFTElement.rentState.rate / LAMPORTS_PER_SOL
        );
        timeLeft = expiryTime(listedNFTElement.rentState.validityExpiry);

        /*if (dataSolana.data.uri.includes("thirdweb")) {
            dataSolana.data.uri = dataSolana.data.uri.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
          const metaDataSolana = await getMetaData(dataSolana.data.uri);
          let image = metaDataSolana.image;
          if (image && image.includes("thirdweb")) {
            image = image.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            metaDataSolana.image = image;
          }*/
        let data = {
          name: listed[k].name,
          image: listed[k].image,
          value: listed[k].value,
          buttonValue: listed[k].buttonValue,
          id: listed[k].tokenId,
          totalAvailable: available,
          rate: listed[k].rentState.rate / LAMPORTS_PER_SOL,
          maxConst: listed[k].rentState.fixedMinutes * 60,
          minConst: 60,
          durationType: type,
          minTimeString: minTimeString,
          maxTimeString: maxTimeString,
          duration: duration,
          ratePerHour: ratePerHour,
          profit: profit,
          rentType: rentType,
          timeLeft: timeLeft,
          explorerLink: `https://solscan.io/token/${listed[k].tokenAddress}?cluster=devnet`,
          magiceden: `https://magiceden.io/item-details/${listed[k].tokenAddress}`,
          metaDataLink: listed[k].metadata_link,
          owner: wallet.publicKey.toBase58(),
          token: id,
        };
        listedNFT.push(data);
      }
      // }
    }

    for (let k = 0; k < allBorrowed.length; k++) {
      let cardTime = getCardMaxTime(allBorrowed[k].rentState.validityExpiry);
      if (allBorrowed[k].rentState.isFixed) {
        cardTime = getTimeForCard(allBorrowed[k].rentState.fixedMinutes * 60);
      }
      let type = "Fixed Duration : " + cardTime;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let timeLeft = "";
      let rentType = "Fixed";

      let dataSolana;
      if (
        allBorrowed[k].name === null ||
        typeof allBorrowed[k].name === "undefined"
      ) {
        dataSolana = await getData(connection, allBorrowed[k].tokenId);
        if (dataSolana.data.uri.includes("thirdweb")) {
          dataSolana.data.uri = dataSolana.data.uri.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }
        const metaDataSolana = await getMetaData(dataSolana.data.uri);
        let image = metaDataSolana.image;
        if (image && image.includes("thirdweb")) {
          image = image.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          metaDataSolana.image = image;
        }

        allBorrowed[k].name = metaDataSolana.name;
        allBorrowed[k].image = metaDataSolana.image;
      }
      //if (dataSolana) {
      if (allBorrowed[k].tokenAddress && allBorrowed[k].tokenAddress === id) {
        if (!allBorrowed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }
        minTimeString = timeString(60);
        maxTimeString = timeString(allBorrowed[k].rentState.fixedMinutes * 60);
        ratePerHour = getRatePerHour(
          allBorrowed[k].rentState.rate / LAMPORTS_PER_SOL
        );
        if (!allBorrowed[k].rentState.isFixed) {
          duration = duration = getCardMaxTime(
            allBorrowed[k].rentState.validityExpiry
          );
          profit = calculateProfit(
            allBorrowed[k].rentState.rate / LAMPORTS_PER_SOL,
            totalTimeLeft(allBorrowed[k].rentState.rentExpiry) / 60
          );
        } else {
          duration = getDuration(allBorrowed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            allBorrowed[k].rentState.rate / LAMPORTS_PER_SOL,
            allBorrowed[k].rentState.fixedMinutes
          );
        }
        timeLeft = expiryTime(allBorrowed[k].rentState.rentExpiry);
        /*if (dataSolana.data.uri.includes("thirdweb")) {
            dataSolana.data.uri = dataSolana.data.uri.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
          const metaDataSolana = await getMetaData(dataSolana.data.uri);
          let image = metaDataSolana.image;
          if (image && image.includes("thirdweb")) {
            image = image.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            metaDataSolana.image = image;
          }*/
        let data = {
          name: allBorrowed[k].name,
          image: allBorrowed[k].image,
          value: allBorrowed[k].value,
          buttonValue: allBorrowed[k].buttonValue,
          id: allBorrowed[k].tokenId,
          totalAvailable: available,
          rate: allBorrowed[k].rentState.rate / LAMPORTS_PER_SOL,
          maxConst: allBorrowed[k].rentState.fixedMinutes * 60,
          minConst: 60,
          durationType: type,
          minTimeString: minTimeString,
          maxTimeString: maxTimeString,
          duration: duration,
          ratePerHour: ratePerHour,
          profit: profit,
          rentType: rentType,
          timeLeft: timeLeft,
          explorerLink: `https://solscan.io/token/${allBorrowed[k].tokenAddress}?cluster=devnet`,
          magiceden: `https://magiceden.io/item-details/${allBorrowed[k].tokenAddress}`,
          metaDataLink: allBorrowed[k].metadataLink,
          owner: wallet.publicKey.toBase58(),
          token: id,
        };
        borrowedNFT.push(data);
      }
      //}
    }
  } catch (error) {
    console.error(error);
  }

  var otherList = { owned: listings, listed: listedNFT, rented: borrowedNFT };
  return otherList;
};

// get nft detail in rent page by symbol id
export const getRentNftByCollectionSolana = async (wallet, connection, id) => {
  let rented = [];
  let available = [];
  try {
    const listings = await getAssetManagersByToken(id, 0);

    let listArr = [];
    for (let i in listings) {
      if(listings[i].rentState.validityExpiry > Date.now() / 1000){
      let number = getCardMaxTime(listings[i].rentState.offerExpiry);
      if (listings[i].rentState.isFixed) {
        number = getTimeForCard(listings[i].rentState.fixedMinutes * 60);
      }
      let type = "Fixed Duration : " + number;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let rentType = "Fixed";
      let timeLeft = "";
      let maxTimeInSecond = 0;
      try {
        if (
          listings[i].name === null ||
          typeof listings[i].name === "undefined"
        ) {
          const state = await programs.metadata.Metadata.findByMint(
            connection,
            listings[i].tokenId
          );
          if (state.data.data.uri.includes("thirdweb")) {
            state.data.data.uri = state.data.data.uri.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
          const metaDataSolana = await getMetaData(state.data.data.uri);
          let image = metaDataSolana.image;
          if (image && image.includes("thirdweb")) {
            image = image.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            metaDataSolana.image = image;
          }
          listings[i].name = metaDataSolana.name;
          listings[i].image = metaDataSolana.image;
        }
        listings[i] = { ...listings[i] };

        if (
          listings[i].state === "STALE" ||
          listings[i].state === "STALEANDLOAN"
        ) {
          if (!listings[i].rentState.isFixed) {
            type = "Max Duration : " + number;
            rentType = "Variable";
          }
          minTimeString = timeString(60);
          maxTimeString = timeString(listings[i].rentState.fixedMinutes * 60);

          maxTimeInSecond = getMaxTimeInSecond(
            listings[i].rentState.validityExpiry
          );
          if (!listings[i].rentState.isFixed) {
            duration = getCardMaxTime(listings[i].rentState.validityExpiry);
            profit = calculateProfit(
              listings[i].rentState.rate / LAMPORTS_PER_SOL,
              totalTimeLeft(listings[i].rentState.validityExpiry) / 60
            );
          } else {
            duration = getDuration(listings[i].rentState.fixedMinutes * 60);
            profit = calculateProfit(
              listings[i].rentState.rate / LAMPORTS_PER_SOL,
              listings[i].rentState.fixedDuration
            );
          }

          ratePerHour = getRatePerHour(
            listings[i].rentState.rate / LAMPORTS_PER_SOL
          );

          timeLeft = expiryTime(listings[i].rentState.validityExpiry);

          listings[i] = {
            ...listings[i],
            value: "Available",
            buttonValue: "Rent",
            durationType: type,
            minTimeString: minTimeString,
            maxTimeInSecond: maxTimeInSecond,
            maxTimeString: maxTimeString,
            duration: duration,
            ratePerHour: ratePerHour,
            profit: profit,
            rentType: rentType,
            timeLeft: timeLeft,
          };

          listArr.push(listings[i]);
        }
      } catch (e) {
        // await deleteListing(listings[i].state.tokenPubkey);
      }

      try {
        var rentedList = [];
        if (wallet.publicKey !== null) {
          /*const listingNft = await getParsedNftAccountsByOwner({
            publicAddress: wallet.publicKey.toBase58(),
            connection,
            sanitize: true,
          });*/
          //if (listingNft.length) {
          //for (let i of listingNft) {
          let type = "";
          let minTimeString = "";
          let maxTimeString = "";
          let ratePerHour = 0;
          let profit = 0;
          let duration = "";
          let rentType = "Fixed";
          let timeLeft = "";
          let maxTimeInSecond = 0;
          try {
            // const state = await getNFTstate(i.mint, wallet);
            const value = listings.filter((a) => {
              const isRentOrLoan =
                a.state === "RENT" || a.state === "RENTANDLOAN";

                const isRentee = a.rentState && a.rentState.rentee.includes(wallet.publicKey.toBase58());

              return isRentOrLoan && isRentee;
            });

            for (const item of value) {
              if (
                item &&
                typeof item.tokenAddress !== "undefined" &&
                item.tokenAddress === id
              ) {
                  if (!item.rentState.isFixed) {
                    type =
                      "Max Duration : " +
                      getCardMaxTime(item.rentState.validityExpiry);
                    rentType = "Variable";
                  } else {
                    type =
                      "Fixed Duration : " +
                      getTimeForCard(item.rentState.fixedMinutes);
                  }
                  minTimeString = timeString(60);
                  maxTimeString = timeString(item.rentState.fixedMinutes);
                  if (!item.rentState.isFixed) {
                    duration = getCardMaxTime(item.rentState.validityExpiry);
                    profit = calculateProfit(
                      item.rentState.rate / LAMPORTS_PER_SOL,
                      totalTimeLeft(item.rentState.rentExpiry) / 60
                    );
                    maxTimeInSecond = getMaxTimeInSecond(
                      item.rentState.validityExpiry
                    );
                  } else {
                    duration = getDuration(item.rentState.fixedMinutes * 60);
                    profit = calculateProfit(
                      item.rentState.rate / LAMPORTS_PER_SOL,
                      item.rentState.fixedMinutes
                    );
                    maxTimeInSecond = item.rentState.fixedMinutes * 60;
                  }
                  ratePerHour = getRatePerHour(
                    item.rentState.rate / LAMPORTS_PER_SOL
                  );

                  timeLeft = expiryTime(item.rentState.rentExpiry);
                  i = {
                    ...item,
                    data: i,
                    value: "Rented",
                    buttonValue: "Withdraw",
                    durationType: type,
                    minTimeString: minTimeString,
                    maxTimeString: maxTimeString,
                    duration: duration,
                    ratePerHour: ratePerHour,
                    profit: profit,
                    rentType: rentType,
                    timeLeft: timeLeft,
                    maxTimeInSecond: maxTimeInSecond,
                  };
                  rentedList.push(i);
              
              }
              // const state = await getMetadata(connection, listings[i].token);
            }
          } catch (e) {
            console.error(e);
            toast.error(e.message);
          }
          // }
          //}
        }
      } catch (e) {
        console.error(e);
      }

      try {
        available = [];
        rented = [];
        var dataAvail = Object.keys(listArr).map((key) => listArr[key]);
        let arrAvail = {};
        let k = dataAvail.length;
        for (let i = 0; i < k; i++) {
          let val; //= await axios.get(dataAvail[i].data.data.uri);

          val = {
            //...val.data,
            name: listArr[i].name,
            image: listArr[i].image,
            buttonValue: listArr[i].buttonValue,
            value: listArr[i].value,
            id: listArr[i].mint,
            durationType: listArr[i].durationType,
            minTimeString: listArr[i].minTimeString,
            maxTimeString: listArr[i].maxTimeString,
            duration: listArr[i].duration,
            ratePerHour: listArr[i].ratePerHour,
            profit: listArr[i].profit,
            rentType: listArr[i].rentType,
            timeLeft: listArr[i].timeLeft,
            maxTimeInSecond: listArr[i].maxTimeInSecond,
            explorerLink: `https://solscan.io/token/${listArr[i].tokenAddress}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${listArr[i].tokenAddress}`,
            metaDataLink: listArr[i].metadataLink,
            owner: listArr[i].initializer,
            id: listArr[i].tokenId,
            tokenId: listArr[i].tokenId,
            rate: listArr[i].rentState.rate / LAMPORTS_PER_SOL,
            minConst: 60,
            maxConst: listArr[i].rentState.fixedMinutes * 60,
            fixedDuration: listArr[i].rentState.fixedMinutes,
            rateValue: listArr[i].rentState.rate,
            token: id,
          };

          available.push(val);
        }

        var data = Object.keys(rentedList).map((key) => rentedList[key]);
        let arr = {};
        let n = data.length;
        for (let i = 0; i < n; i++) {
          //let val = await axios.get(data[i].data.data.uri);
          let val = {
            //...val.data,
            name: rentedList[i].name,
            image: rentedList[i].image,
            buttonValue: rentedList[i].buttonValue,
            value: rentedList[i].value,
            id: rentedList[i].mint,
            durationType: rentedList[i].durationType,
            minTimeString: rentedList[i].minTimeString,
            maxTimeString: rentedList[i].maxTimeString,
            duration: rentedList[i].duration,
            ratePerHour: rentedList[i].ratePerHour,
            profit: rentedList[i].profit,
            rentType: rentedList[i].rentType,
            timeLeft: rentedList[i].timeLeft,
            explorerLink: `https://solscan.io/token/${rentedList[i].tokenAddress}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${rentedList[i].tokenAddress}`,
            metaDataLink: rentedList[i].metadataLink,
            owner: rentedList[i].initializer,
            id: rentedList[i].tokenId,
            rate: rentedList[i].rentState.rate / LAMPORTS_PER_SOL,
            minConst: 60,
            maxConst: rentedList[i].rentState.fixedMinutes * 60,
            fixedDuration: rentedList[i].rentState.fixedMinutes,
            rateValue: rentedList[i].rentState.rate,
            token: id,
          };

          rented.push(val);
        }
      } catch (e) {
        console.error(e);
      }
    }}
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }

  let list = { available: available, rented: rented };
  return list;
};

export const getRentalNftByCollectionSolana = async (
  wallet,
  connection,
  id
) => {
  let rented = [];
  try {
    const listings = await getAssetManagersByToken(id, 0);
    for (let i in listings) {
      if (
        listings[i].name === null ||
        typeof listings[i].name === "undefined"
      ) {
        const state = await programs.metadata.Metadata.findByMint(
          connection,
          listings[i].tokenId
        );
        if (state.data.data.uri.includes("thirdweb")) {
          state.data.data.uri = state.data.data.uri.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }
        const metaDataSolana = await getMetaData(state.data.data.uri);
        let image = metaDataSolana.image;
        if (image && image.includes("thirdweb")) {
          image = image.replace(
            "https://ipfs.thirdwebcdn.com/ipfs/",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          metaDataSolana.image = image;
        }
        listings[i].name = metaDataSolana.name;
        listings[i].image = metaDataSolana.image;
      }
    }
    try {
      var rentedList = [];
      if (wallet.publicKey !== null) {
        let type = "";
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let rentType = "Fixed";
        let timeLeft = "";
        let maxTimeInSecond = 0;
        try {
          const value = listings.filter((a) => {
            const isRentOrLoan =
              a.state === "RENT" || a.state === "RENTANDLOAN";

            const isRentee =
              a.rentState &&
              a.rentState.rentee.includes(wallet.publicKey.toBase58());

            return isRentOrLoan && isRentee;
          });

          for (let item of value) {
            if (
              item &&
              typeof item.tokenAddress !== "undefined" &&
              item.tokenAddress === id
            ) {
              if (item.state === "RENT" || item.state === "RENTANDLOAN") {
                if (!item.rentState.isFixed) {
                  type =
                    "Max Duration : " +
                    getCardMaxTime(item.rentState.validityExpiry);
                  rentType = "Variable";
                } else {
                  type =
                    "Fixed Duration : " +
                    getTimeForCard(item.rentState.fixedMinutes);
                }
                minTimeString = timeString(60);
                maxTimeString = timeString(item.rentState.fixedMinutes);
                if (!item.rentState.isFixed) {
                  duration = getCardMaxTime(item.rentState.validityExpiry);
                  profit = calculateProfit(
                    item.rentState.rate / LAMPORTS_PER_SOL,
                    totalTimeLeft(item.rentState.rentExpiry) / 60
                  );
                  maxTimeInSecond = getMaxTimeInSecond(
                    item.rentState.validityExpiry
                  );
                } else {
                  duration = getDuration(item.rentState.fixedMinutes * 60);
                  profit = calculateProfit(
                    item.rentState.rate / LAMPORTS_PER_SOL,
                    item.rentState.fixedMinutes
                  );
                  maxTimeInSecond = item.rentState.fixedMinutes * 60;
                }
                ratePerHour = getRatePerHour(
                  item.rentState.rate / LAMPORTS_PER_SOL
                );

                timeLeft = expiryTime(item.rentState.rentExpiry);
                let i = {
                  ...item,
                  data: item,
                  value: "Rented",
                  buttonValue: "Withdraw",
                  durationType: type,
                  minTimeString: minTimeString,
                  maxTimeString: maxTimeString,
                  duration: duration,
                  ratePerHour: ratePerHour,
                  profit: profit,
                  rentType: rentType,
                  timeLeft: timeLeft,
                  maxTimeInSecond: maxTimeInSecond,
                };
                rentedList.push(i);
              }
            }
            // const state = await getMetadata(connection, listings[i].token);
          }
        } catch (e) {
          console.error(e);
          toast.error(e.message);
        }
        // }
        //}
      }
    } catch (e) {
      console.error(e);
    }

    try {
      var data = Object.keys(rentedList).map((key) => rentedList[key]);
      let n = data.length;
      for (let i = 0; i < n; i++) {

        let val = {
          name: rentedList[i].name,
          image: rentedList[i].image,
          buttonValue: rentedList[i].buttonValue,
          value: rentedList[i].value,
          id: rentedList[i].mint,
          durationType: rentedList[i].durationType,
          minTimeString: rentedList[i].minTimeString,
          maxTimeString: rentedList[i].maxTimeString,
          duration: rentedList[i].duration,
          ratePerHour: rentedList[i].ratePerHour,
          profit: rentedList[i].profit,
          rentType: rentedList[i].rentType,
          timeLeft: rentedList[i].timeLeft,
          explorerLink: `https://solscan.io/token/${rentedList[i].tokenAddress}?cluster=devnet`,
          magiceden: `https://magiceden.io/item-details/${rentedList[i].tokenAddress}`,
          metaDataLink: rentedList[i].metadataLink,
          owner: rentedList[i].initializer,
          id: rentedList[i].tokenId,
          rate: rentedList[i].rentState.rate / LAMPORTS_PER_SOL,
          minConst: 60,
          maxConst: rentedList[i].rentState.fixedMinutes * 60,
          fixedDuration: rentedList[i].rentState.fixedMinutes,
          rateValue: rentedList[i].rentState.rate,
          token: id,
          ownerShare: rentedList[i].rentState.ownerShare
        };

        rented.push(val);
      }
    } catch (e) {
      console.error(e);
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }

  return { rented: rented };
};
