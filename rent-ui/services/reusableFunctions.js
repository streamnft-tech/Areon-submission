import axios from "axios";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
} from "@solana/spl-token";

import { AccountId } from "@hashgraph/sdk";
import {
  calculateProfit,
  expiryTime,
  getDuration,
  getMinutes,
  getRate,
  getRatePerHour,
  getTimeForCard,
  timeString,
  getCardMaxTime,
  totalTimeLeft,
  getMaxTimeInSecond,
  getHederaCollectionArray,
  hederaMainnetChainId,
  getSolanaCollectionArray,
  url,
} from "../util/common";
import { toast } from "react-toastify";
import { getAssetManagersByToken } from "test-multichain-sdk";
import {
  getCollections,
  getProvider as getProviderEVM,
} from "streamnft-evm-test";
import {
  checkPairing,
  getNFTImageURI,
  getUserNftByCollection,
} from "../util/hashConnectProvider";
import { ethers, formatEther } from "ethers";
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

async function getNFTstate(minftId, wallet) {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  const program = new Program(IDL, programID, provider);
  try {
    let tx = await program.account.assetManager.all([
      {
        memcmp: {
          offset: 225,
          bytes: minftId,
        },
      },
    ]);
    return tx;
  } catch (e) {
    console.error(e);
  }
}

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
    console.error(e);
  }
};

const getMetaData = async (uri) => {
  if (!uri.includes("thirdweb")) {
    const response = await fetch(uri);
    const jsonData = await response.json();

    let imageUri = jsonData.image;
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

const getMetaplexMetadata = async (id, connection) => {
  const state = await programs.metadata.Metadata.findByMint(connection, id);

  return state;
};
export const getProgramId = () => {
  return new PublicKey(PROGRAM_ID);
};

export const solanaPostList = async (nftmint) => {
  try {
    const res = await fetch(`${url}/solana/listRent/${nftmint}/${PROGRAM_ID}`);
  } catch (e) {
    console.error(e);
  }
};

export const solanaProcessRent = async (nftmint) => {
  await fetch(`${url}/solana/processRent/${nftmint}/${PROGRAM_ID}`);
};

export const solanaCancelRent = async (nftmint, collection, initializer) => {
  await fetch(
    `${url}/solana/cancelRent/${nftmint}/${PROGRAM_ID}/${collection}/${initializer}`
  );
};

export const solanaExpireRent = async (nftmint) => {
  await fetch(`${url}/solana/expireRent/${nftmint}/${PROGRAM_ID}`);
};
// Get User Reward
export const getUserRewards = async (wallet, connection) => {
  // TODO get reward value function call
  if (wallet.publicKey !== null) {
    const provider = await getProvider(wallet);
    const programID = getProgramId();
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(IDL, programID, provider);
    const transactionSignatures = await (
      await connection.getConfirmedSignaturesForAddress2(programID, {
        limit: 1000,
      })
    ).map((tx) => tx.signature);

    const recentTransactions = await connection.getParsedTransactions(
      transactionSignatures,
      { commitment: "confirmed" }
    );
    const SPL_TOKEN_PREFIX = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const SYSVAR_RENT_PUBKEY = new PublicKey(
      "SysvarRent111111111111111111111111111111111"
    );
    const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

    let count = 0;

    recentTransactions.map(async (tx) => {
      if (
        tx.transaction.message.instructions[0].programId.toString() ===
        programID.toString()
      ) {
        if (tx.transaction.message.instructions) {
          const coder = new BorshCoder(IDL);
          const instructions = tx.transaction.message.instructions;
          for (const instruction of instructions) {
            if (instruction.data) {
              try {
                const ix = coder.instruction.decode(instruction.data, "base58");

                if (typeof ix !== "undefined" && ix !== null) {
                  Object.keys(program.methods).map(async (name) => {
                    if (name === ix.name) {
                      const x = ix.name;
                      tx.transaction.message.instructions[0].accounts.forEach(
                        (e) => {
                          if (
                            e.toString() != SPL_TOKEN_PREFIX.toString() &&
                            e.toString() != SYSVAR_RENT_PUBKEY.toString() &&
                            e.toString() != SYSTEM_PROGRAM_ID.toString() &&
                            e.toString() === wallet.publicKey.toString()
                          ) {
                            count++;
                          }
                        }
                      );
                    }
                  });
                }
              } catch (e) {}
            }
          }
        } else {
          console.error("error in Buffer");
        }
      }
    });
    return count;
  }
};

// Get collection detail in home page
export const getAllCollection = async (wallet, connection) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  try {
    const txa = await program.account.assetManager.all();
    let allCollection = new Set();
    //allCollection.add("71F4kMDdioSSY1FXPNaAm17E5eGfrnedZ39q8gdUXjA3");
    //allCollection.add("FXptWotMQM9q8gSW3NUcKiwBkrYLWvxk8sqXkrz5ZpWN");
    //allCollection.add("4y86NwgaX78TtXMNffiCFyduKEz4ostp9VxGWnK7pujk");
    txa.forEach(function (value) {
      allCollection.add(value.account.collection.toBase58());
    });

    //let countDetail = await getListingCount();
    var totalList = 0;
    var totalRent = 0;
    let collectionData = [];
    for (let a of allCollection) {
      const dataSolana = await getData(connection, a);
      if (dataSolana !== "undefined" && dataSolana && dataSolana.data.uri) {
        var rent = 0;
        var list = 0;
        for (let c in txa) {
          if (a === txa[c].account.collection.toBase58()) {
            if (
              txa[c].account.state.stale ||
              txa[c].account.state.staleAndLoan
            ) {
              list++;
              totalList++;
            }
            if (txa[c].account.state.rent || txa[c].account.state.rentAndLoan) {
              rent++;
              totalRent++;
            }
          }
        }
        var finalData = { ...dataSolana.data, rent: rent, list: list, id: a };
        collectionData.push(finalData);
      }
    }
    let collectionList = []; //
    for (let b in collectionData) {
      let uri = collectionData[b].uri;
      if (collectionData[b].uri.includes("thirdweb")) {
        uri = uri.replace(
          "https://ipfs.thirdwebcdn.com/ipfs/",
          "https://ipfs.io/ipfs/"
        );
      }
      if (!collectionData[b].uri.includes("thirdweb")) {
        const data = await getMetaData(uri);
        var price = 0;
        /*try {
          const floorPrice = await fetch(
            `https://api-mainnet.magiceden.dev/v2/collections/${collectionData[b].symbol.toLowerCase().replace(/ /g,"_")}/stats`, {
              method: 'GET',
              redirect: 'follow',
              }
          );
          if (floorPrice.json.floorPrice !== null) {
            price = floorPrice;
          }
        } catch (e) {}*/
        if (data) {
          var finalCollection = {
            ...data,
            floorPrice: price,
            rent: collectionData[b].rent,
            list: collectionData[b].list,
            id: collectionData[b].id,
            totalList: totalList,
            totalRent: totalRent,
          };
          collectionList.push(finalCollection);
        }
      }
    }
    // const othercollection = {
    //   name: "OTHER",
    //   symbol: "OTHER",
    //   description: "Collection of all other Wallet NFTs",
    //   image:
    //     "https://arweave.net/hoBBcoePHeMkr6E7R_EvLNb3E7oH2i-Pg3e_49pHt5o?ext=png",
    //   rent: 0,
    //   list: 0,
    //   totalList: totalList,
    //   totalRent: totalRent,
    //   id: "OTHER",
    // };
    //collectionList.push(othercollection);
    return collectionList;
  } catch (e) {
    toast.error(e);
    console.error(e);
  }
};

// Get collection set
export const getCollectionSet = async (wallet) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  try {
    const txa = await program.account.assetManager.all();
    let allCollection = new Set();
    txa.forEach(function (value) {
      allCollection.add(value.account.collection.toBase58());
    });

    return allCollection;
  } catch (e) {
    console.error(e);
  }
};

// Get collection id from symbol in home page
export const getCollectionIdFromSymbol = async (wallet, connection, symbol) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  try {
    const txa = await program.account.assetManager.all();
    let allCollection = new Set();
    txa.forEach(function (value) {
      allCollection.add(value.account.collection.toBase58());
    });

    for (let a of allCollection) {
      const dataSolana = await getData(connection, a);

      if (dataSolana !== "undefined" && dataSolana) {
        if (dataSolana.data.symbol === symbol) {
          return dataSolana.mint;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
};

// Get collection id from name in home page
export const getCollectionIdByName = async (wallet, connection, name) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  try {
    const txa = await program.account.assetManager.all();
    let allCollection = new Set();
    txa.forEach(function (value) {
      allCollection.add(value.account.collection.toBase58());
    });

    for (let a of allCollection) {
      const dataSolana = await getData(connection, a);
      if (dataSolana !== "undefined" && dataSolana) {
        if (dataSolana.data.name === name) {
          return dataSolana.mint;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
};

// get nft detail in lend page by symbol id
export const getWalletLendNftByCollection = async (wallet, connection, id) => {
  var listings = [];
  let listedNFT = [];
  let borrowedNFT = [];
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  const program = new Program(IDL, programID, provider);
  const allEscrowAsset = await program.account.assetManager.all();
  const listingNft = await getParsedNftAccountsByOwner({
    publicAddress: wallet.publicKey.toBase58(),
    connection,
    sanitize: true,
  });
  var available = 0;
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
              const state = await getNFTstate(listingNft[i].mint, wallet);
              if (
                typeof state !== "undefined" &&
                state.length &&
                state.length !== 0
              ) {
                if (state[0].account.state.loan) {
                  available++;
                  listingNft[i] = {
                    ...listingNft[i],
                    value: "Owner",
                    buttonValue: "Lend",
                  };
                  listings.push(listingNft[i]);
                }
              } else {
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
    };
  }
  /*if ("OTHER" === symbol) {
    return { owned: listings, listed: [], rented: [] };
  }*/
  try {
    const allListed =
      typeof allEscrowAsset !== "undefined"
        ? allEscrowAsset.filter(
            (a) =>
              a.account.initializerKey.toBase58() ===
              wallet.publicKey.toBase58()
          )
        : [];
    var listed = [];
    var allBorrowed = [];
    for (let i in allListed) {
      if (
        allListed[i].account.state.stale ||
        allListed[i].account.state.staleAndLoan
      ) {
        allListed[i] = {
          ...allListed[i],
          value: "Listed",
          buttonValue: "Cancel",
        };
        listed.push(allListed[i]);
      }
      if (
        allListed[i].account.state.rent ||
        allListed[i].account.state.rentAndLoan
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
      let cardTime = getCardMaxTime(listed[k].account.offerExpiry.toNumber());
      if (listed[k].account.rentIsFixed) {
        cardTime = getTimeForCard(
          listed[k].account.fixedDuration.toNumber() * 60
        );
      }
      let type = "Fixed Duration : " + cardTime;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let timeLeft = "";
      let rentType = "Fixed";
      const dataSolana = await getData(connection, listed[k].account.mint);

      if (dataSolana) {
        if (
          dataSolana.collection &&
          dataSolana.collection.key &&
          dataSolana.collection.key === id
        ) {
          if (!listed[k].account.rentIsFixed) {
            type = "Max Duration : " + cardTime;
            rentType = "Variable";
          }

          minTimeString = timeString(
            listed[k].account.minDuration.toNumber() * 60
          );
          maxTimeString = timeString(
            listed[k].account.fixedDuration.toNumber() * 60
          );
          if (!listed[k].account.rentIsFixed) {
            duration = getCardMaxTime(listed[k].account.offerExpiry.toNumber());

            profit = calculateProfit(
              listed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
              totalTimeLeft(listed[k].account.offerExpiry.toNumber()) / 60
            );
          } else {
            duration = getDuration(
              listed[k].account.fixedDuration.toNumber() * 60
            );
            profit = calculateProfit(
              listed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
              listed[k].account.fixedDuration.toNumber()
            );
          }
          ratePerHour = getRatePerHour(
            listed[k].account.rate.toNumber() / LAMPORTS_PER_SOL
          );
          timeLeft = expiryTime(listed[k].account.offerExpiry.toNumber());

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
          let data = {
            ...metaDataSolana,
            value: listed[k].value,
            buttonValue: listed[k].buttonValue,
            id: listed[k].account.mint.toBase58(),
            totalAvailable: available,
            rate: listed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
            maxConst: listed[k].account.fixedDuration.toNumber() * 60,
            minConst: listed[k].account.minDuration.toNumber() * 60,
            durationType: type,
            minTimeString: minTimeString,
            maxTimeString: maxTimeString,
            duration: duration,
            ratePerHour: ratePerHour,
            profit: profit,
            rentType: rentType,
            timeLeft: timeLeft,
            explorerLink: `https://solscan.io/token/${dataSolana.mint}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${dataSolana.mint}`,
            metaDataLink: dataSolana.data.uri,
            owner: wallet.publicKey.toBase58(),
          };
          listedNFT.push(data);
        }
      }
    }

    for (let k = 0; k < allBorrowed.length; k++) {
      let cardTime = getCardMaxTime(
        allBorrowed[k].account.offerExpiry.toNumber()
      );
      if (allBorrowed[k].account.rentIsFixed) {
        cardTime = getTimeForCard(
          allBorrowed[k].account.fixedDuration.toNumber() * 60
        );
      }
      let type = "Fixed Duration : " + cardTime;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let timeLeft = "";
      let rentType = "Fixed";

      const dataSolana = await getData(connection, allBorrowed[k].account.mint);
      if (dataSolana) {
        if (
          dataSolana.collection &&
          dataSolana.collection.key &&
          dataSolana.collection.key === id
        ) {
          if (!allBorrowed[k].account.rentIsFixed) {
            type = "Max Duration : " + cardTime;
            rentType = "Variable";
          }
          minTimeString = timeString(
            allBorrowed[k].account.minDuration.toNumber() * 60
          );
          maxTimeString = timeString(
            allBorrowed[k].account.fixedDuration.toNumber() * 60
          );
          ratePerHour = getRatePerHour(
            allBorrowed[k].account.rate.toNumber() / LAMPORTS_PER_SOL
          );
          if (!allBorrowed[k].account.rentIsFixed) {
            duration = duration = getCardMaxTime(
              allBorrowed[k].account.offerExpiry.toNumber()
            );
            profit = calculateProfit(
              allBorrowed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
              totalTimeLeft(allBorrowed[k].account.rentExpiry.toNumber()) / 60
            );
          } else {
            duration = getDuration(
              allBorrowed[k].account.fixedDuration.toNumber() * 60
            );
            profit = calculateProfit(
              allBorrowed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
              allBorrowed[k].account.fixedDuration.toNumber()
            );
          }
          timeLeft = expiryTime(allBorrowed[k].account.rentExpiry.toNumber());
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
          let data = {
            ...metaDataSolana,
            value: allBorrowed[k].value,
            buttonValue: allBorrowed[k].buttonValue,
            id: allBorrowed[k].account.mint.toBase58(),
            totalAvailable: available,
            rate: allBorrowed[k].account.rate.toNumber() / LAMPORTS_PER_SOL,
            maxConst: allBorrowed[k].account.fixedDuration.toNumber() * 60,
            minConst: allBorrowed[k].account.minDuration.toNumber() * 60,
            durationType: type,
            minTimeString: minTimeString,
            maxTimeString: maxTimeString,
            duration: duration,
            ratePerHour: ratePerHour,
            profit: profit,
            rentType: rentType,
            timeLeft: timeLeft,
            explorerLink: `https://solscan.io/token/${dataSolana.mint}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${dataSolana.mint}`,
            metaDataLink: dataSolana.data.uri,
            owner: wallet.publicKey.toBase58(),
          };
          borrowedNFT.push(data);
        }
      }
    }
  } catch (error) {
    console.erro(error);
  }

  var otherList = { owned: listings, listed: listedNFT, rented: borrowedNFT };
  return otherList;
};

// get nft detail in rent page by symbol id
export const getWalletRentNftByCollection = async (wallet, connection, id) => {
  let rented = [];
  let available = [];
  try {
    const provider = await getProvider(wallet);
    const programID = getProgramId();
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(IDL, programID, provider);
    const listings = await program.account.assetManager.all();

    let listArr = [];
    for (let i in listings) {
      if (
        typeof listings[i].account.collection !== "undefined" &&
        listings[i].account.collection.toBase58() === id
      ) {
        let number = getCardMaxTime(listings[i].account.offerExpiry.toNumber());
        if (listings[i].account.rentIsFixed) {
          number = getTimeForCard(
            listings[i].account.fixedDuration.toNumber() * 60
          );
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
          const state = await programs.metadata.Metadata.findByMint(
            connection,
            listings[i].account.mint
          );
          if (state.data.data.uri.includes("thirdweb")) {
            state.data.data.uri = state.data.data.uri.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://ipfs.io/ipfs/"
            );
          }
          const metaDataSolana = await getMetaData(state.data.data.uri);
          let image = metaDataSolana.image;
          if (image && image.includes("thirdweb")) {
            image = image.replace(
              "https://ipfs.thirdwebcdn.com/ipfs/",
              "https://ipfs.io/ipfs/"
            );
            metaDataSolana.image = image;
          }
          listings[i] = { ...listings[i], ...state, ...metaDataSolana };

          if (
            listings[i].account.state.stale ||
            listings[i].account.state.staleAndLoan
          ) {
            if (!listings[i].account.rentIsFixed) {
              type = "Max Duration : " + number;
              rentType = "Variable";
            }
            minTimeString = timeString(
              listings[i].account.minDuration.toNumber() * 60
            );
            maxTimeString = timeString(
              listings[i].account.fixedDuration.toNumber() * 60
            );

            maxTimeInSecond = getMaxTimeInSecond(
              listings[i].account.offerExpiry.toNumber()
            );
            if (!listings[i].account.rentIsFixed) {
              duration = getCardMaxTime(
                listings[i].account.offerExpiry.toNumber()
              );
              profit = calculateProfit(
                listings[i].account.rate.toNumber() / LAMPORTS_PER_SOL,
                totalTimeLeft(listings[i].account.offerExpiry.toNumber()) / 60
              );
            } else {
              duration = getDuration(
                listings[i].account.fixedDuration.toNumber() * 60
              );
              profit = calculateProfit(
                listings[i].account.rate.toNumber() / LAMPORTS_PER_SOL,
                listings[i].account.fixedDuration.toNumber()
              );
            }

            ratePerHour = getRatePerHour(
              listings[i].account.rate.toNumber() / LAMPORTS_PER_SOL
            );

            timeLeft = expiryTime(listings[i].account.offerExpiry.toNumber());

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
            setids((ids) => [...new Set([...ids, listings[i].account.mint])]);
          }
        } catch (e) {}
      }

      try {
        var rentedList = [];
        if (wallet.publicKey !== null) {
          const listingNft = await getParsedNftAccountsByOwner({
            publicAddress: wallet.publicKey.toBase58(),
            connection,
            sanitize: true,
          });
          if (listingNft.length) {
            for (let i of listingNft) {
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
                const value = listings.filter((a) =>
                  a.account.mint.toString().includes(i.mint.toString())
                );

                if (
                  value &&
                  value.length !== 0 &&
                  typeof value[0].account.collection !== "undefined" &&
                  value[0].account.collection.toBase58() === id
                ) {
                  const state = value;
                  if (
                    state[0].account.state.rent ||
                    state[0].account.state.rentAndLoan
                  ) {
                    if (!state[0].account.fixedDuration.rentIsFixed) {
                      type =
                        "Max Duration : " +
                        getCardMaxTime(state[0].account.offerExpiry.toNumber());
                      rentType = "Variable";
                    } else {
                      type =
                        "Fixed Duration : " +
                        getTimeForCard(
                          state[0].account.fixedDuration.toNumber()
                        );
                    }
                    minTimeString = timeString(
                      state[0].account.minDuration.toNumber() * 60
                    );
                    maxTimeString = timeString(
                      state[0].account.fixedDuration.toNumber() * 60
                    );
                    if (!state[0].account.rentIsFixed) {
                      duration = getCardMaxTime(
                        state[0].account.offerExpiry.toNumber()
                      );
                      profit = calculateProfit(
                        state[0].account.rate.toNumber() / LAMPORTS_PER_SOL,
                        totalTimeLeft(state[0].account.rentExpiry.toNumber()) /
                          60
                      );
                      maxTimeInSecond = getMaxTimeInSecond(
                        state[0].account.offerExpiry.toNumber()
                      );
                    } else {
                      duration = getDuration(
                        state[0].account.fixedDuration.toNumber() * 60
                      );
                      profit = calculateProfit(
                        state[0].account.rate.toNumber() / LAMPORTS_PER_SOL,
                        state[0].account.fixedDuration.toNumber()
                      );
                      maxTimeInSecond =
                        state[0].account.fixedDuration.toNumber() * 60;
                    }
                    ratePerHour = getRatePerHour(
                      state[0].account.rate.toNumber() / LAMPORTS_PER_SOL
                    );

                    timeLeft = expiryTime(
                      state[0].account.rentExpiry.toNumber()
                    );
                    i = {
                      data: i,
                      account: state[0].account,
                      value: "Rented",
                      buttonValue: "None",
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
              } catch (e) {
                console.error(e);
                toast.error(e.message);
              }
            }
          }
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
          let val = await axios.get(dataAvail[i].data.data.uri);

          val = {
            ...val.data,
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
            explorerLink: `https://solscan.io/token/${dataAvail[i].data.mint}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${dataAvail[i].data.mint}`,
            metaDataLink: dataAvail[i].data.data.uri,
            owner: dataAvail[i].account.initializerKey.toBase58(),
            id: dataAvail[i].account.mint.toString(),
            rate: dataAvail[i].account.rate.toNumber() / LAMPORTS_PER_SOL,
            minConst: dataAvail[i].account.minDuration.toNumber() * 60,
            maxConst: dataAvail[i].account.fixedDuration.toNumber() * 60,
            fixedDuration: dataAvail[i].account.fixedDuration.toNumber(),
            rateValue: dataAvail[i].account.rate.toNumber(),
          };

          available.push(val);
        }

        var data = Object.keys(rentedList).map((key) => rentedList[key]);

        let arr = {};
        let n = data.length;
        for (let i = 0; i < n; i++) {
          let val = await axios.get(data[i].data.data.uri);

          val = {
            ...val.data,
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
            explorerLink: `https://solscan.io/token/${data[i].data.mint}?cluster=devnet`,
            magiceden: `https://magiceden.io/item-details/${data[i].data.mint}`,
            metaDataLink: data[i].data.data.uri,
            owner: rentedList[i].account.initializerKey.toString(),
            id: data[i].account.mint.toString(),
            rate: data[i].account.rate.toNumber() / LAMPORTS_PER_SOL,
            minConst: data[i].account.minDuration.toNumber() * 60,
            maxConst: data[i].account.fixedDuration.toNumber() * 60,
            fixedDuration: data[i].account.fixedDuration.toNumber(),
            rateValue: data[i].account.rate.toNumber(),
          };

          rented.push(val);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }

  let list = { available: available, rented: rented };
  return list;
};

export const withdraw = async (wallet, mintId) => {
  try {
    const provider = await getProvider(wallet);
    const programID = getProgramId();
    const program = new Program(IDL, programID, provider);
    const nftMint = new PublicKey(mintId);
    const initializerMainAccount = wallet;

    const [assetManager, _nounce] = await web3.PublicKey.findProgramAddress(
      [nftMint.toBuffer()],
      program.programId
    );
    /*const takerTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      initializerMainAccount.publicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );*/
    let escrowData = await program.account.assetManager.fetch(assetManager);

    const takerTokenAccount = escrowData.holderTokenAccount;
    const masterEditionId = await MasterEdition.getPDA(nftMint);
    try {
      let tx = await program.methods
        .expireRent()
        .accounts({
          withdrawer: wallet.publicKey,
          assetManager: assetManager,
          holderTokenAccount: takerTokenAccount,
          mint: nftMint,
          edition: masterEditionId,
          metadataAccount: new web3.PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          initializer: escrowData.initializerKey,
          initializerTokenAccount: escrowData.initializerTokenAccount,
        })
        .rpc();

      var str = {
        type: "success",
        message: "Initialize Transaction Completed with transaction id : " + tx,
      };
      return str;
    } catch (e) {
      console.error(e);
      return { type: "error", message: e.message };
    }
  } catch (e) {
    console.error(e);
    return { type: "error", message: e.message };
  }
};

export const cancel = async (wallet, mintId) => {
  try {
    const provider = await getProvider(wallet);
    const programID = getProgramId();
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(IDL, programID, provider);
    const nftMint = new PublicKey(mintId);
    const initializerMainAccount = wallet;
    const masterEditionId = await MasterEdition.getPDA(nftMint);
    const [asset, stateBump] = await PublicKey.findProgramAddress(
      [nftMint.toBuffer()],
      program.programId
    );

    let initializerTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      initializerMainAccount.publicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    try {
      await program.methods
        .cancelRent()
        .accounts({
          initializer: initializerMainAccount.publicKey,
          mint: nftMint,
          assetManager: asset,
          edition: masterEditionId,
          initializerTokenAccount: initializerTokenAccount,
          metadataAccount: new web3.PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      var str = { type: "success", message: "Cancel Completed" };
      return str;
    } catch (e) {
      console.error(e);
      return { type: "error", message: e };
    }
  } catch (e) {
    console.error(e);
    return { type: "error", message: e };
  }
};

export const rentNft = async (wallet, mintId, amt, borrowDuration) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  const nftMint = new PublicKey(mintId);
  const initializerMainAccount = wallet;

  const [assetManager, _nounce] = await web3.PublicKey.findProgramAddress(
    [nftMint.toBuffer()],
    program.programId
  );

  const masterEditionId = await MasterEdition.getPDA(nftMint);
  if (provider.publicKey === null) {
    return { type: "error", message: "Connect your wallet" };
  }
  try {
    let escrowData = await program.account.assetManager.fetch(assetManager);

    const takerTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      initializerMainAccount.publicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    if (escrowData.rentIsFixed) {
      borrowDuration = escrowData.fixedDuration.toNumber();
      amt = escrowData.rate.toNumber();
    }
    let tx = await program.methods
      .processRent(new BN(amt * LAMPORTS_PER_SOL), new BN(borrowDuration))
      .accounts({
        initializer: escrowData.initializerKey,
        initializerTokenAccount: escrowData.initializerTokenAccount,
        taker: wallet.publicKey,
        assetManager: assetManager,
        takerTokenAccount: takerTokenAccount,
        mint: nftMint,
        edition: masterEditionId,
        initializer: escrowData.initializerKey,
        metadataAccount: new web3.PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    var str = {
      type: "success",
      message: "Initialize Transaction Completed with transaction id : " + tx,
    };
    return str;
  } catch (e) {
    //var error = "Not able to complete transaction : " + e;
    console.error(e);
    return { type: "error", message: e.message };
  }
};

export const lendNft = async (
  wallet,
  nftId,
  rateTimeScale,
  rate,
  offertimeScale,
  offerDuration,
  fixedtimeScale,
  fixedDuration,
  revenueShare,
  rentIsFixed
) => {
  const provider = await getProvider(wallet);
  const programID = getProgramId();
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(IDL, programID, provider);
  const nftMint = new PublicKey(nftId);
  const initializerMainAccount = wallet;

  try {
    const initializerTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      initializerMainAccount.publicKey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [assetManager, _nounce] = await web3.PublicKey.findProgramAddress(
      [nftMint.toBuffer()],
      program.programId
    );

    const masterEditionId = await MasterEdition.getPDA(nftMint);
    const metadataAccount = await Metadata.getPDA(nftMint);

    try {
      var solanaRate = getRate(rateTimeScale, rate);
      var offerTime = getMinutes(offertimeScale, offerDuration);
      var fixedTime = getMinutes(fixedtimeScale, fixedDuration);

      let tx = await program.methods
        .initRent(
          new BN(solanaRate),
          new BN(offerTime),
          new BN(fixedTime),
          rentIsFixed,
          new BN(revenueShare)
        )
        .accounts({
          initializer: wallet.publicKey,
          assetManager: assetManager,
          mint: nftMint,
          edition: masterEditionId,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          token: TOKEN_PROGRAM_ID,
          initializerDepositTokenAccount: initializerTokenAccount,
          mplMetadata: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
          metadataAccount: metadataAccount,
          whitelist: assetManager,
        })
        .rpc();

      var str = {
        type: "success",
        message: "Initialize Transaction Completed with transaction id : " + tx,
      };
      return str;
    } catch (e) {
      //var error = "Not able to complete transaction : " + e;
      console.error(e);
      return { type: "error", message: e.message };
    }
  } catch (e) {
    console.error(e);
    return { type: "error", message: e.message };
    // return "Wallet not connected. Connect your Wallet and try again.";
  }
};

export const getUsersRentedNftByCollectionForSolidity = async (
  id,
  chain,
  checkPair
) => {
  const listings = await getAssetManagersByToken(id, chain);
  let rented = [];
  var rentedList = [];
  for (let i in listings) {
    let NFTElementInArray = listings[i];
    if (
      typeof NFTElementInArray.tokenAddress !== "undefined" &&
      NFTElementInArray.tokenAddress.toString() === id
    ) {
      let number = getCardMaxTime(NFTElementInArray.rentState.validityExpiry);
      if (NFTElementInArray.rentState.isFixed) {
        number = getTimeForCard(NFTElementInArray.rentState.fixedMinutes * 60);
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
      // filter for Available
      // filter for Rented
      try {
        //const checkPair = await checkPairing();
        // to store temp array of all rented assets
        if (checkPair) {
          const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
          const walletAddress = `0x${AccountId.fromString(
            JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
              length - 1
            ].accountIds[0]
          )
            .toSolidityAddress()
            .toString()}`;
          if (
            NFTElementInArray.rentState &&
            NFTElementInArray.rentState.rentee === walletAddress
          ) {
            type = "";
            try {
              if (
                NFTElementInArray &&
                typeof NFTElementInArray.tokenAddress !== "undefined" &&
                NFTElementInArray.tokenAddress === id &&
                (NFTElementInArray.state === "RENT" ||
                  NFTElementInArray.state === "RENT_AND_LOAN")
              ) {
                if (NFTElementInArray.rentState.isFixed) {
                  type =
                    "Max Duration : " +
                    getCardMaxTime(NFTElementInArray.rentState.validityExpiry);
                  rentType = "Variable";
                } else {
                  type =
                    "Fixed Duration : " +
                    getTimeForCard(NFTElementInArray.rentState.fixedMinutes);
                }
                minTimeString = timeString(60);
                maxTimeString = timeString(
                  NFTElementInArray.rentState.fixedMinutes * 60
                );
                profit = NFTElementInArray.profit / 100000000;
                if (!NFTElementInArray.rentState.isFixed) {
                  duration = getCardMaxTime(
                    NFTElementInArray.rentState.validityExpiry
                  );

                  maxTimeInSecond = getMaxTimeInSecond(
                    NFTElementInArray.rentState.validityExpiry
                  );
                } else {
                  duration = getDuration(
                    NFTElementInArray.rentState.fixedMinutes * 60
                  );
                  maxTimeInSecond =
                    NFTElementInArray.rentState.fixedMinutes * 60;
                }
                ratePerHour = getRatePerHour(
                  NFTElementInArray.rentState.rate / 100000000
                );
                timeLeft = expiryTime(NFTElementInArray.rentState.rentExpiry);
                i = {
                  ...NFTElementInArray,
                  data: i,
                  account: NFTElementInArray.initializer,
                  value: "Rented",
                  buttonValue: "None",
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
            } catch (e) {
              console.error(e);
              toast.error(e.message);
            }
          }
        }
      } catch (e) {
        console.error("Error occured while filtering for Rented", e);
      }
    }
  }

  // generate appropriate card for the same, return that
  var data = Object.keys(rentedList).map((key) => rentedList[key]);
  let n = data.length;
  for (let i = 0; i < n; i++) {
    let val = await getNFTImageURI(
      AccountId.fromSolidityAddress(data[i].tokenAddress).toString(),
      data[i].tokenId
    );
    val = {
      ...val,
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
      explorerLink: `https://hashscan.io/testnet/token/${data[i].tokenAddress}`,
      hederaTokenAddress: AccountId.fromSolidityAddress(
        data[i].tokenAddress
      ).toString(),
      magiceden: ``,
      metaDataLink: val.metadata,
      owner: AccountId.fromSolidityAddress(
        rentedList[i].initializer
      ).toString(),
      token: data[i].tokenAddress,
      id: data[i].tokenId,
      rate: data[i].rentState.rate / 100000000,
      minConst: 60,
      maxConst: data[i].rentState.fixedMinutes * 60,
      fixedDuration: data[i].rentState.fixedMinutes,
      rateValue: data[i].rentState.rate,
      image: val.image,
      ownerShare: data[i].rentState.rate,
    };
    rented.push(val);
  }
  return { rented };
};

export const getWalletRentNftByCollectionForSolidity = async (
  id,
  chain,
  checkPair
) => {
  let rented = [];
  let available = [];
  try {
    const listings = await getAssetManagersByToken(id, chain);

    let listArr = [];
    var rentedList = [];

    // go through each NFT
    for (let i in listings) {
      // get the NFT asset
      let NFTElementInArray = listings[i];
      if (
        typeof NFTElementInArray.tokenAddress !== "undefined" &&
        NFTElementInArray.tokenAddress.toString() === id
      ) {
        // ^ find nfts in that collection that are escrow assets

        // setup variables for cardData
        let number = getCardMaxTime(NFTElementInArray.rentState.validityExpiry);
        if (NFTElementInArray.rentState.isFixed) {
          number = getTimeForCard(
            NFTElementInArray.rentState.fixedMinutes * 60
          );
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
        // filter for Available
        try {
          if (
            NFTElementInArray.state === "STALE" ||
            NFTElementInArray.state === "STALE_AND_LOAN"
          ) {
            if (!NFTElementInArray.rentState.isFixed) {
              type = "Max Duration : " + number;
              rentType = "Variable";
            }
            minTimeString = timeString(60);
            maxTimeString = timeString(
              NFTElementInArray.rentState.fixedMinutes * 60
            );
            maxTimeInSecond = getMaxTimeInSecond(
              NFTElementInArray.rentState.validityExpiry
            );
            profit = NFTElementInArray.profit / 100000000;
            if (!NFTElementInArray.rentState.isFixed) {
              duration = getCardMaxTime(
                NFTElementInArray.rentState.validityExpiry
              );
            } else {
              duration = getDuration(
                NFTElementInArray.rentState.fixedMinutes * 60
              );
            }
            ratePerHour = getRatePerHour(
              NFTElementInArray.rentState.rate / 100000000
            );
            timeLeft = expiryTime(NFTElementInArray.rentState.validityExpiry);
            NFTElementInArray = {
              ...NFTElementInArray,
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
            listArr.push(NFTElementInArray);
          }
        } catch (e) {
          console.error("Error occured while filtering for Available", e);
        }

        // filter for Rented
        try {
          //const checkPair = await checkPairing();
          if (checkPair) {
            const length = JSON.parse(localStorage.getItem("hashconnectData"))
              .pairingData.length;
            const walletAddress = `0x${AccountId.fromString(
              JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
                length - 1
              ].accountIds[0]
            )
              .toSolidityAddress()
              .toString()}`;
            if (
              NFTElementInArray.rentState &&
              NFTElementInArray.rentState.rentee !== ""
            ) {
              type = "";
              try {
                if (
                  NFTElementInArray &&
                  typeof NFTElementInArray.tokenAddress !== "undefined" &&
                  // TO DO clear doubt what to show in marketplace rent
                  //NFTElementInArray.tokenAddress === id &&
                  (NFTElementInArray.state === "RENT" ||
                    NFTElementInArray.state === "RENT_AND_LOAN")
                ) {
                  if (NFTElementInArray.rentState.isFixed) {
                    type =
                      "Max Duration : " +
                      getCardMaxTime(
                        NFTElementInArray.rentState.validityExpiry
                      );
                    rentType = "Variable";
                  } else {
                    type =
                      "Fixed Duration : " +
                      getTimeForCard(NFTElementInArray.rentState.fixedMinutes);
                  }
                  minTimeString = timeString(60);
                  maxTimeString = timeString(
                    NFTElementInArray.rentState.fixedMinutes * 60
                  );
                  profit = NFTElementInArray.profit / 100000000;
                  if (!NFTElementInArray.rentState.isFixed) {
                    duration = getCardMaxTime(
                      NFTElementInArray.rentState.validityExpiry
                    );

                    maxTimeInSecond = getMaxTimeInSecond(
                      NFTElementInArray.rentState.validityExpiry
                    );
                  } else {
                    duration = getDuration(
                      NFTElementInArray.rentState.fixedMinutes * 60
                    );
                    maxTimeInSecond =
                      NFTElementInArray.rentState.fixedMinutes * 60;
                  }
                  ratePerHour = getRatePerHour(
                    NFTElementInArray.rentState.rate / 100000000
                  );
                  timeLeft = expiryTime(NFTElementInArray.rentState.rentExpiry);
                  i = {
                    ...NFTElementInArray,
                    data: i,
                    account: NFTElementInArray.initializer,
                    value: "Rented",
                    buttonValue: "None",
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
              } catch (e) {
                console.error(e);
                toast.error(e.message);
              }
            }
          }
        } catch (e) {
          console.error("Error occured while filtering for Rented", e);
        }
      }
    }
    // done filtering out escrow assets to get rented and available
    // filter the expired NFTs
    listArr = listArr.filter((availNft) => availNft.timeLeft !== "0S");
    // rentedList = rentedList.filter((rentNft) => rentNft.timeLeft !== "0S");
    // generate the complete objects for each NFT across both lists
    try {
      available = [];
      rented = [];
      var dataAvail = Object.keys(listArr).map((key) => listArr[key]);
      let k = dataAvail.length;
      for (let i = 0; i < k; i++) {
        let val = await getNFTImageURI(
          AccountId.fromSolidityAddress(dataAvail[i].tokenAddress).toString(),
          dataAvail[i].tokenId
        );
        val = {
          ...val,
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
          explorerLink: `https://hashscan.io/testnet/token/${dataAvail[i].tokenAddress}`,
          magiceden: ``,
          hederaTokenAddress: AccountId.fromSolidityAddress(
            dataAvail[i].tokenAddress
          ).toString(),
          owner: AccountId.fromSolidityAddress(
            dataAvail[i].initializer
          ).toString(),
          token: dataAvail[i].tokenAddress,
          id: dataAvail[i].tokenId,
          rate: dataAvail[i].rentState.rate / 100000000,
          minConst: 60,
          maxConst: dataAvail[i].rentState.fixedMinutes * 60,
          fixedDuration: dataAvail[i].rentState.fixedMinutes,
          rateValue: dataAvail[i].rentState.rate,
          ownerShare: dataAvail[i].rentState.ownerShare,
        };
        available.push(val);
      }
      var data = Object.keys(rentedList).map((key) => rentedList[key]);
      let n = data.length;
      for (let i = 0; i < n; i++) {
        let val = await getNFTImageURI(
          AccountId.fromSolidityAddress(data[i].tokenAddress).toString(),
          data[i].tokenId
        );
        val = {
          ...val,
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
          explorerLink: `https://hashscan.io/testnet/token/${data[i].tokenAddress}`,
          hederaTokenAddress: AccountId.fromSolidityAddress(
            data[i].tokenAddress
          ).toString(),
          magiceden: ``,
          metaDataLink: val.metaDataLink,
          owner: AccountId.fromSolidityAddress(
            rentedList[i].initializer
          ).toString(),
          token: data[i].tokenAddress,
          id: data[i].tokenId,
          rate: data[i].rentState.rate / 100000000,
          minConst: 60,
          maxConst: data[i].rentState.fixedMinutes * 60,
          fixedDuration: data[i].rentState.fixedMinutes,
          rateValue: data[i].rentState.rate,
          image: val.image,
          ownerShare: data[i].rentState.ownerShare,
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
  let list = { available: available, rented: rented };
  return list;
};

export const getWalletLendNftByCollectionForSolidity = async (id, chain) => {
  const allEscrowAsset = await getAssetManagersByToken(id, chain);
  let userNFTs = await getUserNftByCollection(id);
  var available = 0;
  // first, we get all the NFTs that are owned by the user
  userNFTs = userNFTs.map((listing) => {
    available++;
    return {
      ...listing,
      value: "Owned",
      buttonValue: "Lend",
      token: listing.token_id,
      id: listing.serial_number,
      metaDataLink: listing.metaDataLink,
      owner: listing.account_id,
      explorerLink: `https://hashscan.io/testnet/token/${listing.token_id}`,
      magiceden: ``,
      totalAvailable: available,
      durationType: "",
      image: listing.image,
      hederaTokenAddress: listing.token_id,
      name: listing.name,
    };
  });

  // then, we get all the NFTs that are escrow assets, listed by the user
  try {
    const checkPair = await checkPairing();
    if (checkPair) {
      const length = JSON.parse(localStorage.getItem("hashconnectData"))
        .pairingData.length;
      const walletAddress = `0x${AccountId.fromString(
        JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
          length - 1
        ].accountIds[0]
      )
        .toSolidityAddress()
        .toString()}`;
      const allListedOrRented =
        typeof allEscrowAsset !== "undefined"
          ? allEscrowAsset.filter((a) => a.initializer === walletAddress)
          : [];

      // list of cardData variables
      let cardTime = "";
      let type = "Fixed Duration : " + cardTime;
      let minTimeString = "";
      let maxTimeString = "";
      let ratePerHour = 0;
      let profit = 0;
      let duration = "";
      let timeLeft = "";
      let rentType = "Fixed";

      // filter the listed nfts and setup basic array without metadata
      var listed = allListedOrRented
        .filter(
          (nftElement) =>
            (nftElement.state === "STALE" ||
              nftElement.state === "STALE_AND_LOAN") &&
            typeof nftElement.tokenAddress !== "undefined"
        )
        .map((listedNFTElement) => {
          cardTime = getCardMaxTime(listedNFTElement.rentState.validityExpiry);
          if (listedNFTElement.rentState.isFixed) {
            cardTime = getTimeForCard(
              listedNFTElement.rentState.fixedMinutes * 60
            );
          }
          type = "Fixed Duration : " + cardTime;
          if (!listedNFTElement.rentState.isFixed) {
            type = "Max Duration : " + cardTime;
            rentType = "Variable";
          }
          minTimeString = timeString(60);
          maxTimeString = timeString(
            listedNFTElement.rentState.fixedMinutes * 60
          );
          profit = listedNFTElement.profit / 100000000;
          if (!listedNFTElement.rentState.isFixed) {
            duration = getCardMaxTime(
              listedNFTElement.rentState.validityExpiry
            );
          } else {
            duration = getDuration(
              listedNFTElement.rentState.fixedMinutes * 60
            );
          }
          ratePerHour = getRatePerHour(
            listedNFTElement.rentState.rate / 100000000
          );
          const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
          timeLeft = expiryTime(listedNFTElement.rentState.validityExpiry);
          return {
            image: "", // to be filled later
            name: "", // to be filled later
            metaDataLink: "", // to be filled later
            value: "Listed",
            buttonValue: "Cancel",
            token: listedNFTElement.tokenAddress,
            id: listedNFTElement.tokenId,
            totalAvailable: available,
            rate: listedNFTElement.rentState.rate / 100000000,
            maxConst: listedNFTElement.rentState.fixedMinutes * 60,
            minConst: 60,
            durationType: type,
            minTimeString: minTimeString,
            maxTimeString: maxTimeString,
            duration: duration,
            ratePerHour: ratePerHour,
            profit: profit,
            rentType: rentType,
            timeLeft: timeLeft,
            owner: JSON.parse(localStorage.getItem("hashconnectData"))
              .pairingData[length - 1].accountIds[0],
            explorerLink: `https://hashscan.io/testnet/token/${listedNFTElement.tokenAddress}`,
            magiceden: ``,
            hederaTokenAddress: AccountId.fromSolidityAddress(
              listedNFTElement.tokenAddress
            ).toString(),
            ownerShare: listedNFTElement.rentState.ownerShare,
          };
        });

      // filter the borrowed nfts and setup basic array without metadata
      var borrowed = allListedOrRented
        .filter(
          (nftElement) =>
            (nftElement.state === "RENT" ||
              nftElement.state === "RENT_AND_LOAN") &&
            typeof nftElement.tokenAddress !== "undefined" &&
            nftElement.owner !==
              JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
                length - 1
              ].accountIds[0]
        )
        .map((rentedNFTElement) => {
          // setup variables
          cardTime = getCardMaxTime(rentedNFTElement.rentState.validityExpiry);
          if (rentedNFTElement.rentState.isFixed) {
            cardTime = getTimeForCard(
              rentedNFTElement.rentState.fixedMinutes * 60
            );
          }
          type = "Fixed Duration : " + cardTime;
          if (!rentedNFTElement.rentState.isFixed) {
            type = "Max Duration : " + cardTime;
            rentType = "Variable";
          }
          minTimeString = timeString(60);
          maxTimeString = timeString(
            rentedNFTElement.rentState.fixedMinutes * 60
          );
          ratePerHour = getRatePerHour(
            rentedNFTElement.rentState.rate / 100000000
          );
          profit = rentedNFTElement.profit / 100000000;
          if (!rentedNFTElement.rentState.isFixed) {
            duration = getCardMaxTime(
              rentedNFTElement.rentState.validityExpiry
            );
          } else {
            duration = getDuration(
              rentedNFTElement.rentState.fixedMinutes * 60
            );
          }
          timeLeft = expiryTime(rentedNFTElement.rentState.rentExpiry);
          const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
          return {
            image: "", // to be filled later
            name: "", // to be filled later
            metaDataLink: "", // to be filled later
            value: "Rented",
            buttonValue: "Withdraw",
            token: rentedNFTElement.tokenAddress,
            id: rentedNFTElement.tokenId,
            totalAvailable: available,
            rate: rentedNFTElement.rentState.rate / 100000000,
            maxConst: rentedNFTElement.rentState.fixedMinutes,
            minConst: 60,
            durationType: type,
            minTimeString: minTimeString,
            maxTimeString: maxTimeString,
            duration: duration,
            ratePerHour: ratePerHour,
            profit: profit,
            rentType: rentType,
            timeLeft: timeLeft,
            owner: JSON.parse(localStorage.getItem("hashconnectData"))
              .pairingData[length - 1].accountIds[0],
            explorerLink: `https://hashscan.io/testnet/token/${rentedNFTElement.tokenAddress}`,
            magiceden: ``,
            hederaTokenAddress: AccountId.fromSolidityAddress(
              rentedNFTElement.tokenAddress
            ).toString(),
            ownerShare: rentedNFTElement.rentState.ownerShare,
          };
        });

      // get the metadata for each NFT in listed and borrowed
      let arrSize = listed.length;
      for (let i = 0; i < arrSize; i++) {
        var data = Object.keys(listed).map((key) => listed[key]);
        const _hederaNFTAddress = AccountId.fromSolidityAddress(
          data[i].token
        ).toString();
        const metadataHedera = await getNFTImageURI(
          _hederaNFTAddress,
          data[i].id
        );
        listed[i] = {
          ...listed[i],
          image: metadataHedera.image,
          name: metadataHedera.name,
          metaDataLink: metadataHedera.metaDataLink || "",
        };
      }
      arrSize = borrowed.length;
      for (let i = 0; i < arrSize; i++) {
        var data = Object.keys(borrowed).map((key) => borrowed[key]);
        const _hederaNFTAddress = AccountId.fromSolidityAddress(
          data[i].token
        ).toString();
        const metadataHedera = await getNFTImageURI(
          _hederaNFTAddress,
          data[i].id
        );
        borrowed[i] = {
          ...borrowed[i],
          image: metadataHedera.image,
          name: metadataHedera.name,
          metaDataLink: metadataHedera.metaDataLink || "",
        };
      }
    }
  } catch (error) {
    console.error(error);
  }

  var otherList = { owned: userNFTs, listed: listed, rented: borrowed };
  return otherList;
};

export const getCollectionSolidityAddressByName = async (name, chainId) => {
  /* create the program interface combining the idl, program ID, and provider */
  if (chainId == hederaMainnetChainId) {
    try {
      const data = await getHederaCollectionArray(chainId);
      // const item = data.find((item) => item.name === name);
      const formattedName = (str) => str.toLowerCase().replace(/[\s-]+/g, "");
      const item = data.find(
        (item) => formattedName(item.name) === formattedName(name)
      );

      if (item) {
        return item.token_address;
      }
      return undefined;
    } catch (e) {
      console.error(e);
    }
  }
  if (chainId == 0) {
    try {
      const data = await getSolanaCollectionArray(chainId);
      const item = data.find((item) => item.name === name);
      if (item) {
        return item.token_address;
      }
      return undefined;
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      const data = await getCollections(chainId);
      const item = data.find((item) => item.name === name);
      if (item) {
        return item.token_address;
      }
      return undefined;
    } catch (e) {
      console.error(e);
    }
  }
};

// ERC-721 ABI with only the tokenURI function
const erc721ABI = [
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const getEVMMetadata = async (contractAddress, tokenId) => {
  const provider = await getProviderEVM(41).then((res) => {
    return res;
  });
  const contract = new ethers.Contract(contractAddress, erc721ABI, provider);
  try {
    const tokenURI = await contract.tokenURI(tokenId);
    return tokenURI;
  } catch (error) {
    console.error("Error fetching token URI:", error);
    return null;
  }
};

export const formatAssetsByDB = (outputs) => {
  return outputs.map((output) => {
    return {
      initializer: output.initializer,
      tokenAddress: output.token_address,
      tokenId: Number(output.token_id),
      LoanPoolIndex: Number(output.loan_pool_index),
      LoanOfferIndex: Number(output.loan_offer_index),
      state: output.state,
      metadata_uri: output.metadata_uri,
      metadata_link: output.metadata_link,
      name: output.name,
      image: output.image,
      loanState: {
        loanExpiry: Number(output.loan_expiry),
        provider: output.provider,
      },
      rentState: {
        rate: output.rate ? output.rate : 0,
        validityExpiry: output.validity_expiry
          ? Number(output.validity_expiry)
          : 0,
        isFixed: output.is_fixed,
        fixedMinutes: output.fixed_minutes ? Number(output.fixed_minutes) : 0,
        ownerShare: output.owner_share ? Number(output.owner_share) : 0,
        rentExpiry: output.rent_expiry ? Number(output.rent_expiry) : 0,
        rentee: output.rentee,
        whitelist: output.whitelist,
        privateRental: output.private_rental,
      },
    };
  });
};

const fetchMetadata = async (tokenAddress, tokenId) => {
  try {
    const meta = await getEVMMetadata(tokenAddress, tokenId);
    let response = {};
    if (meta.includes("https")) {
      // handle https case
    } else {
      const uri = meta.replace("ipfs://", "https://hashpack.b-cdn.net/ipfs/");
      response = await fetch(uri).then((r) => r.json());
    }
    if (!response.image.includes("https")) {
      response.image = response.image.replace(
        "ipfs://",
        "https://hashpack.b-cdn.net/ipfs/"
      );
    }
    return response;
  } catch (e) {}
};

const updateNFTData = async (nft, tokenAddress) => {
  try {
    const metadata = await fetchMetadata(tokenAddress, nft.tokenId);
    return {
      ...nft,
      ...metadata,
      image: metadata.image,
      name: metadata.name,
    };
  } catch (e) {
    console.error(e);
  }
};

const processListings = async (allListed, available, address, tokenAddress) => {
  const listedNFT = [];
  const borrowedNFT = [];

  for (let i in allListed) {
    const item = allListed[i];
    let value, buttonValue;

    if (item.state === "STALE" || item.state === "STALE_AND_LOAN") {
      value = "Listed";
      buttonValue = "Cancel";
    } else if (item.state === "RENT" || item.state === "RENT_AND_LOAN") {
      value = "Rented";
      buttonValue = "Withdraw";
    } else {
      continue; // Skip this iteration if state doesn't match any condition
    }

    const updatedNFT = await updateNFTData(
      {
        ...item,
        value,
        buttonValue,
        totalAvailable: available,
        token: tokenAddress,
        id: item.tokenId,
        owner: address,
        // ... other properties as needed
      },
      tokenAddress
    );

    if (value === "Listed") {
      listedNFT.push(updatedNFT);
    } else {
      borrowedNFT.push(updatedNFT);
    }
  }

  return { listedNFT, borrowedNFT };
};

export const getSepoliaLendData2 = async (
  data,
  userNFTs,
  address,
  isConnected,
  tokenAddress
) => {
  let listings = [];
  let available = 0;

  if (userNFTs.length) {
    const listingNft = userNFTs[0].nft_data;
    for (let i in listingNft) {
      try {
        const updatedNFT = await updateNFTData(listingNft[i], tokenAddress);
        listingNft[i] = updatedNFT;
        available++;
        listings.push(updatedNFT);
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      }
    }
  }

  let listedNFT = [];
  let borrowedNFT = [];
  if (isConnected && data.length > 0) {
    const allListed = data.filter((a) => a.initializer === address);
    const result = await processListings(
      allListed,
      available,
      address,
      tokenAddress
    );
    listedNFT = result.listedNFT;
    borrowedNFT = result.borrowedNFT;
  }
  return { owned: listings, listed: listedNFT, rented: borrowedNFT };
};

export const getSepoliaLendData = async (
  data,
  userNFTs,
  address,
  isConnected,
  tokenAddress
) => {
  var listings = [];
  let listedNFT = [];
  let borrowedNFT = [];

  const allEscrowAsset = data;

  var available = 0;

  // var id = "OTHER";
  // if ("OTHER" !== name) {
  //const id = await getCollectionIdByName(wallet, connection, name);
  //}

  if (userNFTs.length && userNFTs.length > 0) {
    const listingNft = userNFTs[0].nft_data;

    for (let i in listingNft) {
      try {
        const meta = await getEVMMetadata(tokenAddress, listingNft[i].token_id);
        let response = {};
        if (meta.includes("https")) {
          /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
        } else {
          const uri = meta.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          const resp = await fetch(uri).then((r) => {
            r = r.json();
            return r;
          });
          listingNft[i].name = resp.name;
          listingNft[i].metadata_link = uri;
          response = resp;
        }
        if (!response.image.includes("https")) {
          listingNft[i].image = response.image.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }

        if (typeof response !== "undefined" || response !== null) {
          available++;
          listingNft[i] = {
            ...listingNft[i],
            value: "Owned",
            buttonValue: "Lend",
          };
          listings.push(listingNft[i]);
          
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      }
    }
  }

  for (let i in listings) {
    listings[i] = {
      value: listings[i].value,
      buttonValue: listings[i].buttonValue,
      token: tokenAddress,
      id: listings[i].token_id,
      metaDataLink: listings[i].metadata_link,
      owner: address,
      explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listings[i].tokenId}`,
      magiceden: ``,
      opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listings[i].tokenId}`,
      totalAvailable: available,
      durationType: "",
      image: listings[i].image,
      name: listings[i].name,
    };
  }
  /*if ("OTHER" === symbol) {
    return { owned: listings, listed: [], rented: [] };
  }*/
  try {
    if (isConnected && data.length > 0) {
      const allListed = allEscrowAsset;
      var listed = [];
      var allBorrowed = [];
      for (let i in allListed) {
        if (
          allListed[i].state === "STALE" ||
          allListed[i].state === "STALE_AND_LOAN"
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
          allListed[i].state === "RENT_AND_LOAN"
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
        let cardTime = getCardMaxTime(listed[k].rentState.validityExpiry);
        if (listed[k].rentState.isFixed) {
          cardTime = getTimeForCard(listed[k].rentState.fixedMinutes * 60);
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";
        //const dataSolana = await getData(connection, listed[k].account.mint);

        if (!listed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }

        minTimeString = timeString(60);
        maxTimeString = timeString(listed[k].rentState.fixedMinutes * 60);
        if (!listed[k].rentState.isFixed) {
          duration = getCardMaxTime(listed[k].rentState.validityExpiry);

          profit = calculateProfit(
            parseFloat(formatEther(listed[k].rentState.rate)),
            totalTimeLeft(listed[k].rentState.validityExpiry) / 60
          );
        } else {
          duration = getDuration(listed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            parseFloat(formatEther(listed[k].rentState.rate)),
            listed[k].rentState.fixedMinutes
          );
        }
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(listed[k].rentState.rate))
        );
        timeLeft = expiryTime(listed[k].rentState.validityExpiry);

        // TO DO remove token +1
        if (listed[k].image === null) {
          const meta = await getEVMMetadata(tokenAddress, listed[k].tokenId);
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            listed[k].name = resp.name;
            listed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            listed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }

        let data = {
          name: listed[k].name,
          image: listed[k].image,
          value: listed[k].value,
          buttonValue: listed[k].buttonValue,
          token: tokenAddress,
          id: listed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(listed[k].rentState.rate)),
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
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listed[k].tokenId}`,
          metaDataLink: listed[k].metadata_link,
          hederaTokenAddress: "",
          privateRental: listed[k].rentState?.privateRental,
          whitelist: listed[k].rentState?.whitelist,
        };
        listedNFT.push(data);
      }

      for (let k = 0; k < allBorrowed.length; k++) {
        let cardTime = getCardMaxTime(allBorrowed[k].rentState.validityExpiry);
        if (allBorrowed[k].rentState.isFixed) {
          cardTime = getTimeForCard(allBorrowed[k].rentState.fixedMinutes * 60);
        }
        if (allBorrowed[k].rentState.rentExpiry > Date.now() / 1000) {
          allBorrowed[k].buttonValue = "None";
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";

        if (!allBorrowed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }
        minTimeString = timeString(60);
        maxTimeString = timeString(allBorrowed[k].rentState.fixedMinutes * 60);
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(allBorrowed[k].rentState.rate))
        );
        if (!allBorrowed[k].rentState.isFixed) {
          duration = duration = getCardMaxTime(
            allBorrowed[k].rentState.validityExpiry
          );
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            totalTimeLeft(allBorrowed[k].rentState.rentExpiry) / 60
          );
        } else {
          duration = getDuration(allBorrowed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            allBorrowed[k].rentState.fixedMinutes
          );
        }
        timeLeft = expiryTime(allBorrowed[k].rentState.rentExpiry);

        if (allBorrowed[k].image === null) {
          const meta = await getEVMMetadata(
            tokenAddress,
            allBorrowed[k].tokenId
          );
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            allBorrowed[k].name = resp.name;
            allBorrowed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            allBorrowed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }
        let data = {
          name: allBorrowed[k].name,
          image: allBorrowed[k].image,
          value: allBorrowed[k].value,
          buttonValue: allBorrowed[k].buttonValue,
          token: tokenAddress,
          id: allBorrowed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(allBorrowed[k].rentState.rate)),
          maxConst: allBorrowed[k].rentState.fixedMinutes,
          minConst: 60,
          durationType: type,
          minTimeString: minTimeString,
          maxTimeString: maxTimeString,
          duration: duration,
          ratePerHour: ratePerHour,
          profit: profit,
          rentType: rentType,
          timeLeft: timeLeft,
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${allBorrowed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${allBorrowed[k].tokenId}`,
          metaDataLink: allBorrowed[k].metadata_link,
          hederaTokenAddress: "",
        };
        borrowedNFT.push(data);
      }
    }
  } catch (error) {
    console.error(error);
  }

  var otherList = { owned: listings, listed: listedNFT, rented: borrowedNFT };
  return otherList;
};

export const getTelosLendData = async (
  data,
  userNFTs,
  address,
  isConnected,
  tokenAddress
) => {
  var listings = [];
  let listedNFT = [];
  let borrowedNFT = [];

  const allEscrowAsset = data;
  var available = 0;

  if (userNFTs.length && userNFTs.length > 0) {
    const listingNft = userNFTs;

    for (let i in listingNft) {
      try {
        const meta = await getEVMMetadata(tokenAddress, listingNft[i].tokenId);
        let response = {};
        if (meta.includes("https")) {
          /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
        } else {
          const uri = meta.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          const resp = await fetch(uri);

          response = await resp.json();
          listingNft[i].name = response.name || "";
          listingNft[i].metadata_link = uri;
        }
        if (!response.image.includes("https")) {
          listingNft[i].image = response.image.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }

        if (typeof response !=undefined || response!=null) {
          available++;
          listingNft[i] = {
            ...listingNft[i],
            value: "Owned",
            buttonValue: "Lend",
          };
          listings.push(listingNft[i]);
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      }
    }
  }

  for (let i in listings) {
    listings[i] = {
      value: listings[i].value,
      buttonValue: listings[i].buttonValue,
      token: tokenAddress,
      id: listings[i].tokenId,
      metaDataLink: listings[i].metadata_link,
      owner: address,
      explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listings[i].tokenId}`,
      magiceden: ``,
      opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listings[i].tokenId}`,
      totalAvailable: available,
      durationType: "",
      image: listings[i].image,
      name: listings[i].name,
    };
  }

  /*if ("OTHER" === symbol) {
    return { owned: listings, listed: [], rented: [] };
  }*/
  try {
    if (isConnected && data.length > 0) {
      const allListed = allEscrowAsset;
      var listed = [];
      var allBorrowed = [];
      for (let i in allListed) {
        if (
          allListed[i].state === "STALE" ||
          allListed[i].state === "STALE_AND_LOAN"
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
          allListed[i].state === "RENT_AND_LOAN"
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
        let cardTime = getCardMaxTime(listed[k].rentState.validityExpiry);
        if (listed[k].rentState.isFixed) {
          cardTime = getTimeForCard(listed[k].rentState.fixedMinutes * 60);
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";
        //const dataSolana = await getData(connection, listed[k].account.mint);

        if (!listed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }

        minTimeString = timeString(60);
        maxTimeString = timeString(listed[k].rentState.fixedMinutes * 60);
        if (!listed[k].rentState.isFixed) {
          duration = getCardMaxTime(listed[k].rentState.validityExpiry);

          profit = calculateProfit(
            parseFloat(formatEther(listed[k].rentState.rate)),
            totalTimeLeft(listed[k].rentState.validityExpiry) / 60
          );
        } else {
          duration = getDuration(listed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            listed[k].rentState.rate,
            listed[k].rentState.fixedMinutes
          );
        }
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(listed[k].rentState.rate))
        );
        timeLeft = expiryTime(listed[k].rentState.validityExpiry);

        // TO DO remove token +1
        if (listed[k].image === null) {
          const meta = await getEVMMetadata(tokenAddress, listed[k].tokenId);
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            listed[k].name = resp.name;
            listed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            listed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }

        let data = {
          name: listed[k].name,
          image: listed[k].image,
          value: listed[k].value,
          buttonValue: listed[k].buttonValue,
          token: tokenAddress,
          id: listed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(listed[k].rentState.rate)),
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
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listed[k].tokenId}`,
          metaDataLink: listed[k].metadata_link,
          hederaTokenAddress: "",
          privateRental: listed[k].rentState?.privateRental,
          whitelist: listed[k].rentState?.whitelist,
        };
        listedNFT.push(data);
      }

      for (let k = 0; k < allBorrowed.length; k++) {
        let cardTime = getCardMaxTime(allBorrowed[k].rentState.validityExpiry);
        if (allBorrowed[k].rentState.isFixed) {
          cardTime = getTimeForCard(allBorrowed[k].rentState.fixedMinutes * 60);
        }
        if (allBorrowed[k].rentState.rentExpiry > Date.now() / 1000) {
          allBorrowed[k].buttonValue = "None";
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";

        if (!allBorrowed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }
        minTimeString = timeString(60);
        maxTimeString = timeString(allBorrowed[k].rentState.fixedMinutes * 60);
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(allBorrowed[k].rentState.rate))
        );
        if (!allBorrowed[k].rentState.isFixed) {
          duration = duration = getCardMaxTime(
            allBorrowed[k].rentState.validityExpiry
          );
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            totalTimeLeft(allBorrowed[k].rentState.rentExpiry) / 60
          );
        } else {
          duration = getDuration(allBorrowed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            allBorrowed[k].rentState.fixedMinutes
          );
        }
        timeLeft = expiryTime(allBorrowed[k].rentState.rentExpiry);

        if (allBorrowed[k].image === null) {
          const meta = await getEVMMetadata(
            tokenAddress,
            allBorrowed[k].tokenId
          );
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            allBorrowed[k].name = resp.name;
            allBorrowed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            allBorrowed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }
        let data = {
          name: allBorrowed[k].name,
          image: allBorrowed[k].image,
          value: allBorrowed[k].value,
          buttonValue: allBorrowed[k].buttonValue,
          token: tokenAddress,
          id: allBorrowed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(allBorrowed[k].rentState.rate)),
          maxConst: allBorrowed[k].rentState.fixedMinutes,
          minConst: 60,
          durationType: type,
          minTimeString: minTimeString,
          maxTimeString: maxTimeString,
          duration: duration,
          ratePerHour: ratePerHour,
          profit: profit,
          rentType: rentType,
          timeLeft: timeLeft,
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${allBorrowed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${allBorrowed[k].tokenId}`,
          metaDataLink: allBorrowed[k].metadata_link,
          hederaTokenAddress: "",
        };
        borrowedNFT.push(data);
      }
    }
  } catch (error) {
    console.error(error);
  }

  var otherList = { owned: listings, listed: listedNFT, rented: borrowedNFT };
  return otherList;
};

export const getAreonLendData = async (
  data,
  userNFTs,
  address,
  isConnected,
  tokenAddress
) => {
  console.log("areon data : ", data)
  var listings = [];
  let listedNFT = [];
  let borrowedNFT = [];

  const allEscrowAsset = data;
  var available = 0;

  if (userNFTs.length && userNFTs.length > 0) {
    const listingNft = userNFTs;

    for (let i in listingNft) {
      try {
        const meta = listingNft[i].tokenUri;
        let response = {};
        if (meta.includes("https")) {
          /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
        } else {
          const uri = meta.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
          const resp = await fetch(uri);

          response = await resp.json();
          listingNft[i].name = response.name || "";
          listingNft[i].metadata_link = uri;
        }
        if (!response.image.includes("https")) {
          listingNft[i].image = response.image.replace(
            "ipfs://",
            "https://hashpack.b-cdn.net/ipfs/"
          );
        }

        if (typeof response !=undefined || response!=null) {
          available++;
          listingNft[i] = {
            ...listingNft[i],
            value: "Owned",
            buttonValue: "Lend",
          };
          listings.push(listingNft[i]);
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
      }
    }
  }

  for (let i in listings) {
    listings[i] = {
      value: listings[i].value,
      buttonValue: listings[i].buttonValue,
      token: tokenAddress,
      id: listings[i].tokenId,
      metaDataLink: listings[i].metadata_link,
      owner: address,
      explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listings[i].tokenId}`,
      magiceden: ``,
      opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listings[i].tokenId}`,
      totalAvailable: available,
      durationType: "",
      image: listings[i].image,
      name: listings[i].name,
    };
  }

  /*if ("OTHER" === symbol) {
    return { owned: listings, listed: [], rented: [] };
  }*/
  try {
    if ( data.length > 0) {
      const allListed = allEscrowAsset;
      var listed = [];
      var allBorrowed = [];
      for (let i in allListed) {
        if (
          allListed[i].state === "STALE" ||
          allListed[i].state === "STALE_AND_LOAN"
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
          allListed[i].state === "RENT_AND_LOAN"
        ) {
          allListed[i] = {
            ...allListed[i],
            value: "Rented",
            buttonValue: "Withdraw",
          };
          allBorrowed.push(allListed[i]);
        }
      }

      console.log(listed);
      for (let k = 0; k < listed.length; k++) {
        let cardTime = getCardMaxTime(listed[k].rentState.validityExpiry);
        if (listed[k].rentState.isFixed) {
          cardTime = getTimeForCard(listed[k].rentState.fixedMinutes * 60);
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";
        //const dataSolana = await getData(connection, listed[k].account.mint);

        if (!listed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }

        minTimeString = timeString(60);
        maxTimeString = timeString(listed[k].rentState.fixedMinutes * 60);
        if (!listed[k].rentState.isFixed) {
          duration = getCardMaxTime(listed[k].rentState.validityExpiry);

          profit = calculateProfit(
            parseFloat(formatEther(listed[k].rentState.rate)),
            totalTimeLeft(listed[k].rentState.validityExpiry) / 60
          );
        } else {
          duration = getDuration(listed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            listed[k].rentState.rate,
            listed[k].rentState.fixedMinutes
          );
        }
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(listed[k].rentState.rate))
        );
        timeLeft = expiryTime(listed[k].rentState.validityExpiry);

        // TO DO remove token +1
        if (listed[k].image === null) {
          const meta = await getEVMMetadata(tokenAddress, listed[k].tokenId);
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            listed[k].name = resp.name;
            listed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            listed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }

        let data = {
          name: listed[k].name,
          image: listed[k].image,
          value: listed[k].value,
          buttonValue: listed[k].buttonValue,
          token: tokenAddress,
          id: listed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(listed[k].rentState.rate)),
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
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${listed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${listed[k].tokenId}`,
          metaDataLink: listed[k].metadata_link,
          hederaTokenAddress: "",
          privateRental: listed[k].rentState?.privateRental,
          whitelist: listed[k].rentState?.whitelist,
        };
        listedNFT.push(data);
      }

      for (let k = 0; k < allBorrowed.length; k++) {
        let cardTime = getCardMaxTime(allBorrowed[k].rentState.validityExpiry);
        if (allBorrowed[k].rentState.isFixed) {
          cardTime = getTimeForCard(allBorrowed[k].rentState.fixedMinutes * 60);
        }
        if (allBorrowed[k].rentState.rentExpiry > Date.now() / 1000) {
          allBorrowed[k].buttonValue = "None";
        }
        let type = "Fixed Duration : " + cardTime;
        let minTimeString = "";
        let maxTimeString = "";
        let ratePerHour = 0;
        let profit = 0;
        let duration = "";
        let timeLeft = "";
        let rentType = "Fixed";

        if (!allBorrowed[k].rentState.isFixed) {
          type = "Max Duration : " + cardTime;
          rentType = "Variable";
        }
        minTimeString = timeString(60);
        maxTimeString = timeString(allBorrowed[k].rentState.fixedMinutes * 60);
        ratePerHour = getRatePerHour(
          parseFloat(formatEther(allBorrowed[k].rentState.rate))
        );
        if (!allBorrowed[k].rentState.isFixed) {
          duration = duration = getCardMaxTime(
            allBorrowed[k].rentState.validityExpiry
          );
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            totalTimeLeft(allBorrowed[k].rentState.rentExpiry) / 60
          );
        } else {
          duration = getDuration(allBorrowed[k].rentState.fixedMinutes * 60);
          profit = calculateProfit(
            parseFloat(formatEther(allBorrowed[k].rentState.rate)),
            allBorrowed[k].rentState.fixedMinutes
          );
        }
        timeLeft = expiryTime(allBorrowed[k].rentState.rentExpiry);

        if (allBorrowed[k].image === null) {
          const meta = await getEVMMetadata(
            tokenAddress,
            allBorrowed[k].tokenId
          );
          let response = {};
          if (meta.includes("https")) {
            /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
          } else {
            const uri = meta.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
            const resp = await fetch(uri).then((r) => {
              r = r.json();
              return r;
            });
            response = resp;
            allBorrowed[k].name = resp.name;
            allBorrowed[k].metadata_link = uri;
          }
          if (!response.image.includes("https")) {
            allBorrowed[k].image = response.image.replace(
              "ipfs://",
              "https://hashpack.b-cdn.net/ipfs/"
            );
          }
        }
        let data = {
          name: allBorrowed[k].name,
          image: allBorrowed[k].image,
          value: allBorrowed[k].value,
          buttonValue: allBorrowed[k].buttonValue,
          token: tokenAddress,
          id: allBorrowed[k].tokenId,
          totalAvailable: available,
          rate: parseFloat(formatEther(allBorrowed[k].rentState.rate)),
          maxConst: allBorrowed[k].rentState.fixedMinutes,
          minConst: 60,
          durationType: type,
          minTimeString: minTimeString,
          maxTimeString: maxTimeString,
          duration: duration,
          ratePerHour: ratePerHour,
          profit: profit,
          rentType: rentType,
          timeLeft: timeLeft,
          owner: address,
          explorerLink: `https://sepolia.etherscan.io/nft/${tokenAddress}/${allBorrowed[k].tokenId}`,
          magiceden: ``,
          opensea: `https://opensea.io/assets/ethereum/${tokenAddress}/${allBorrowed[k].tokenId}`,
          metaDataLink: allBorrowed[k].metadata_link,
          hederaTokenAddress: "",
        };
        borrowedNFT.push(data);
      }
    }
  } catch (error) {
    console.error(error);
  }

  var otherList = { owned: listings, listed: listedNFT, rented: borrowedNFT };
  return otherList;
};

export const getTelosRentData = async (
  id,
  address,
  data
) => {
  let rented = [];
  let available = [];
  try {
    const filteredListings = filterListingsByWhitelist(data, address);

    const listings = filteredListings;
    let listArr = [];
    for (let i in listings) {
      let number = getCardMaxTime(listings[i].rentState.validityExpiry);
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
          listings[i].state === "STALE" ||
          listings[i].state === "STALE_AND_LOAN"
        ) {
          if (!listings[i].rentState.isFixed) {
            type = "Max Duration : " + number;

            rentType = "Variable";
            minTimeString = timeString(60);
            maxTimeString = timeString(
              listings[i].rentState.validityExpiry * 60
            );

            maxTimeInSecond = getMaxTimeInSecond(
              listings[i].rentState.validityExpiry
            );
          } else {
            minTimeString = timeString(60);
            maxTimeString = timeString(listings[i].rentState.fixedMinutes * 60);

            maxTimeInSecond = getMaxTimeInSecond(
              listings[i].rentState.fixedMinutes
            );
          }
          if (listings[i].rentState.validityExpiry > Date.now() / 1000) {
            if (!listings[i].rentState.isFixed) {
              duration = getCardMaxTime(listings[i].rentState.validityExpiry);
              profit = calculateProfit(
                parseFloat(formatEther(listings[i].rentState.rate)),
                totalTimeLeft(listings[i].rentState.validityExpiry) / 60
              );
            } else {
              duration = getDuration(listings[i].rentState.fixedMinutes * 60);
              profit = calculateProfit(
                listings[i].rentState.rate /1000000000,
                listings[i].rentState.fixedMinutes
              );
            }

            ratePerHour = getRatePerHour(
              parseFloat(formatEther(listings[i].rentState.rate))
            );

            timeLeft = expiryTime(listings[i].rentState.validityExpiry);
            if (listings[i].image === null) {
              const meta = await getEVMMetadata(id, listings[i].tokenId);
              let response = {};
              if (meta.includes("https")) {
                /*uri = metadata;
            const data = {
              url: uri,
            };
            const result = await fetch(`${url}/data`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });
            response = await result.json();*/
              } else {
                const uri = meta.replace(
                  "ipfs://",
                  "https://hashpack.b-cdn.net/ipfs/"
                );
                const resp = await fetch(uri).then((r) => {
                  r = r.json();
                  return r;
                });
                listings[i].name = resp.name;
                listings[i].metadata_link = uri;
                response = resp;
              }
              if (!response.image.includes("https")) {
                listings[i].image = response.image.replace(
                  "ipfs://",
                  "https://hashpack.b-cdn.net/ipfs/"
                );
              }
            }

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
            setids((ids) => [...new Set([...ids, listings[i].account.mint])]);
          }
        }
      } catch (e) {
        // await deleteListing(listings[i].state.tokenPubkey);
      }

      try {
        var rentedList = [];

          const listingNft = listings.filter(
            (a) =>
              (a.state === "RENT" || a.state === "RENT_AND_LOAN")
          );
          if (listingNft.length) {
            for (let i of listingNft) {
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
                const state = i;

                if (!state.rentState.isFixed) {
                  type =
                    "Max Duration : " +
                    getCardMaxTime(state.rentState.validityExpiry);
                  rentType = "Variable";
                } else {
                  type =
                    "Fixed Duration : " +
                    getTimeForCard(state.rentState.fixedMinutes);
                }
                minTimeString = timeString(60);
                maxTimeString = timeString(state.rentState.fixedMinutes * 60);
                if (!state.rentState.isFixed) {
                  duration = getCardMaxTime(state.rentState.validityExpiry);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    totalTimeLeft(state.rentState.rentExpiry) / 60
                  );
                  maxTimeInSecond = getMaxTimeInSecond(
                    state.rentState.validityExpiry
                  );
                } else {
                  duration = getDuration(state.rentState.fixedMinutes * 60);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    state.rentState.fixedMinutes
                  );
                  maxTimeInSecond = state.rentState.fixedMinutes * 60;
                }
                ratePerHour = getRatePerHour(
                  parseFloat(formatEther(state.rentState.rate))
                );

                timeLeft = expiryTime(state.rentState.rentExpiry);
                i = {
                  data: i,
                  account: state.account,
                  value: "Rented",
                  buttonValue: "None",
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
              } catch (e) {
                toast.error(e.message);
              }
            }
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
          let val = {
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
            explorerLink: `https://sepolia.etherscan.io/nft/${dataAvail[i].tokenAddress}/${dataAvail[i].tokenId}`,
            magiceden: ``,
            opensea: `https://opensea.io/assets/ethereum/${dataAvail[i].tokenAddress}/${dataAvail[i].tokenId}`,
            metaDataLink: listArr[i].metadata_link,
            owner: dataAvail[i].initializer,
            token: dataAvail[i].tokenAddress,
            id: dataAvail[i].tokenId,
            rate: parseFloat(formatEther(dataAvail[i].rentState.rate)),
            minConst: 60,
            maxConst: dataAvail[i].rentState.fixedMinutes * 60,
            fixedDuration: dataAvail[i].rentState.fixedMinutes,
            rateValue: dataAvail[i].rentState.rate,
            privateRental: dataAvail[i].rentState?.privateRental,
            whitelist: dataAvail[i].rentState?.whitelist,
            image: listArr[i].image,
            name: listArr[i].name,
          };

          available.push(val);
        }

        var data = Object.keys(rentedList).map((key) => rentedList[key]);

        let arr = {};
        let n = data.length;
        for (let i = 0; i < n; i++) {
          if (
            rentedList[i] &&
            rentedList[i].data &&
            rentedList[i].data.image === null
          ) {
            const meta = await getEVMMetadata(
              data[i].data.tokenAddress,
              data[i].data.tokenId
            );
            let response = {};
            if (meta.includes("https")) {
              /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
            } else {
              const uri = meta.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
              const resp = await fetch(uri).then((r) => {
                r = r.json();
                return r;
              });
              response = resp;
              rentedList[i].data.metadata_link = uri;
              rentedList[i].data.name = resp.name;
            }
            if (!response.image.includes("https")) {
              rentedList[i].data.image = response.image.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
            }
          }

          let val = {
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
            explorerLink: `https://sepolia.etherscan.io/nft/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            magiceden: ``,
            opensea: `https://opensea.io/assets/ethereum/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            metaDataLink: rentedList[i].data.metadata_link,
            owner: rentedList[i].initializer,
            token: data[i].data.tokenAddress,
            id: data[i].data.tokenId,
            rate: parseFloat(formatEther(data[i].data.rentState.rate)),
            minConst: 60,
            maxConst: data[i].data.rentState.fixedMinutes * 60,
            fixedDuration: data[i].data.rentState.fixedMinutes,
            rateValue: parseFloat(formatEther(data[i].data.rentState.rate)),
            image: rentedList[i].data.image,
            name: rentedList[i].data.name,
          };

          rented.push(val);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }

  let list = { available: available, rented: rented };
  return list;
};

export const getTelosMyRentalsData = async (
  address,
  data
) => {
  let rented = [];
  try {
    const filteredListings = filterListingsByWhitelist(data, address);

    const listings = filteredListings;
    
      try {
        var rentedList = [];
          const listingNft = listings.filter(
            (a) =>
              a.rentState.rentee.includes(address) &&
              (a.state === "RENT" || a.state === "RENT_AND_LOAN")
          );
          if (listingNft.length) {
            for (let i of listingNft) {
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
                const state = i;

                if (!state.rentState.isFixed) {
                  type =
                    "Max Duration : " +
                    getCardMaxTime(state.rentState.validityExpiry);
                  rentType = "Variable";
                } else {
                  type =
                    "Fixed Duration : " +
                    getTimeForCard(state.rentState.fixedMinutes);
                }
                minTimeString = timeString(60);
                maxTimeString = timeString(state.rentState.fixedMinutes * 60);
                if (!state.rentState.isFixed) {
                  duration = getCardMaxTime(state.rentState.validityExpiry);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    totalTimeLeft(state.rentState.rentExpiry) / 60
                  );
                  maxTimeInSecond = getMaxTimeInSecond(
                    state.rentState.validityExpiry
                  );
                } else {
                  duration = getDuration(state.rentState.fixedMinutes * 60);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    state.rentState.fixedMinutes
                  );
                  maxTimeInSecond = state.rentState.fixedMinutes * 60;
                }
                ratePerHour = getRatePerHour(
                  parseFloat(formatEther(state.rentState.rate))
                );

                timeLeft = expiryTime(state.rentState.rentExpiry);
                i = {
                  data: i,
                  account: state.account,
                  value: "Rented",
                  buttonValue: "None",
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
              } catch (e) {
                toast.error(e.message);
              }
            }
          }
        
      } catch (e) {
        console.error(e);
      }

      try {
        rented = [];

        var data = Object.keys(rentedList).map((key) => rentedList[key]);

        let n = data.length;
        for (let i = 0; i < n; i++) {
          if (
            rentedList[i] &&
            rentedList[i].data &&
            rentedList[i].data.image === null
          ) {
            const meta = await getEVMMetadata(
              data[i].data.tokenAddress,
              data[i].data.tokenId
            );
            let response = {};
            if (meta.includes("https")) {
              /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
            } else {
              const uri = meta.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
              const resp = await fetch(uri).then((r) => {
                r = r.json();
                return r;
              });
              response = resp;
              rentedList[i].data.metadata_link = uri;
              rentedList[i].data.name = resp.name;
            }
            if (!response.image.includes("https")) {
              rentedList[i].data.image = response.image.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
            }
          }

          let val = {
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
            explorerLink: `https://sepolia.etherscan.io/nft/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            magiceden: ``,
            opensea: `https://opensea.io/assets/ethereum/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            metaDataLink: rentedList[i].data.metadata_link,
            owner: rentedList[i].initializer,
            token: data[i].data.tokenAddress,
            id: data[i].data.tokenId,
            rate: parseFloat(formatEther(data[i].data.rentState.rate)),
            minConst: 60,
            maxConst: data[i].data.rentState.fixedMinutes * 60,
            fixedDuration: data[i].data.rentState.fixedMinutes,
            rateValue: parseFloat(formatEther(data[i].data.rentState.rate)),
            image: rentedList[i].data.image,
            name: rentedList[i].data.name,
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

  let list = { rented: rented };
  return list;
};

const filterListingsByWhitelist = (listings, walletAddress) => {
  return listings.filter((listing) => {
    // Check if the listing's rentState.privateRental is true
    if (listing.rentState && listing.rentState.privateRental) {
      // If privateRental is true, check if the whitelist includes the walletAddress
      return listing.rentState.whitelist.includes(walletAddress);
    }
    // If privateRental is not true, the listing does not match the criteria
    return true;
  });
};

export const getSepolisRentData = async (
  id,
  nfts,
  address,
  isConnected,
  data
) => {
  let rented = [];
  let available = [];
  try {
    const filteredListings = filterListingsByWhitelist(data, address);

    const listings = filteredListings;
    let listArr = [];
    for (let i in listings) {
      let number = getCardMaxTime(listings[i].rentState.validityExpiry);
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
          listings[i].state === "STALE" ||
          listings[i].state === "STALE_AND_LOAN"
        ) {
          if (!listings[i].rentState.isFixed) {
            type = "Max Duration : " + number;

            rentType = "Variable";
            minTimeString = timeString(60);
            maxTimeString = timeString(
              listings[i].rentState.validityExpiry * 60
            );

            maxTimeInSecond = getMaxTimeInSecond(
              listings[i].rentState.validityExpiry
            );
          } else {
            minTimeString = timeString(60);
            maxTimeString = timeString(listings[i].rentState.fixedMinutes * 60);

            maxTimeInSecond = getMaxTimeInSecond(
              listings[i].rentState.fixedMinutes
            );
          }
          if (listings[i].rentState.validityExpiry > Date.now() / 1000) {
            if (!listings[i].rentState.isFixed) {
              duration = getCardMaxTime(listings[i].rentState.validityExpiry);
              profit = calculateProfit(
                parseFloat(formatEther(listings[i].rentState.rate)),
                totalTimeLeft(listings[i].rentState.validityExpiry) / 60
              );
            } else {
              duration = getDuration(listings[i].rentState.fixedMinutes * 60);
              profit = calculateProfit(
                parseFloat(formatEther(listings[i].rentState.rate)),
                listings[i].rentState.fixedMinutes
              );
            }

            ratePerHour = getRatePerHour(
              parseFloat(formatEther(listings[i].rentState.rate))
            );

            timeLeft = expiryTime(listings[i].rentState.validityExpiry);
            if (listings[i].image === null) {
              const meta = await getEVMMetadata(id, listings[i].tokenId);
              let response = {};
              if (meta.includes("https")) {
                /*uri = metadata;
            const data = {
              url: uri,
            };
            const result = await fetch(`${url}/data`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });
            response = await result.json();*/
              } else {
                const uri = meta.replace(
                  "ipfs://",
                  "https://hashpack.b-cdn.net/ipfs/"
                );
                const resp = await fetch(uri).then((r) => {
                  r = r.json();
                  return r;
                });
                listings[i].name = resp.name;
                listings[i].metadata_link = uri;
                response = resp;
              }
              if (!response.image.includes("https")) {
                listings[i].image = response.image.replace(
                  "ipfs://",
                  "https://hashpack.b-cdn.net/ipfs/"
                );
              }
            }

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
            setids((ids) => [...new Set([...ids, listings[i].account.mint])]);
          }
        }
      } catch (e) {
        // await deleteListing(listings[i].state.tokenPubkey);
      }

      try {
        var rentedList = [];

        if (isConnected) {
          const listingNft = listings.filter(
            (a) =>
              a.rentState.rentee.includes(address) &&
              (a.state === "RENT" || a.state === "RENT_AND_LOAN")
          );
          if (listingNft.length) {
            for (let i of listingNft) {
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
                const state = i;

                if (!state.rentState.isFixed) {
                  type =
                    "Max Duration : " +
                    getCardMaxTime(state.rentState.validityExpiry);
                  rentType = "Variable";
                } else {
                  type =
                    "Fixed Duration : " +
                    getTimeForCard(state.rentState.fixedMinutes);
                }
                minTimeString = timeString(60);
                maxTimeString = timeString(state.rentState.fixedMinutes * 60);
                if (!state.rentState.isFixed) {
                  duration = getCardMaxTime(state.rentState.validityExpiry);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    totalTimeLeft(state.rentState.rentExpiry) / 60
                  );
                  maxTimeInSecond = getMaxTimeInSecond(
                    state.rentState.validityExpiry
                  );
                } else {
                  duration = getDuration(state.rentState.fixedMinutes * 60);
                  profit = calculateProfit(
                    parseFloat(formatEther(state.rentState.rate)),
                    state.rentState.fixedMinutes
                  );
                  maxTimeInSecond = state.rentState.fixedMinutes * 60;
                }
                ratePerHour = getRatePerHour(
                  parseFloat(formatEther(state.rentState.rate))
                );

                timeLeft = expiryTime(state.rentState.rentExpiry);
                i = {
                  data: i,
                  account: state.account,
                  value: "Rented",
                  buttonValue: "None",
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
              } catch (e) {
                toast.error(e.message);
              }
            }
          }
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
          let val = {
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
            explorerLink: `https://sepolia.etherscan.io/nft/${dataAvail[i].tokenAddress}/${dataAvail[i].tokenId}`,
            magiceden: ``,
            opensea: `https://opensea.io/assets/ethereum/${dataAvail[i].tokenAddress}/${dataAvail[i].tokenId}`,
            metaDataLink: listArr[i].metadata_link,
            owner: dataAvail[i].initializer,
            token: dataAvail[i].tokenAddress,
            id: dataAvail[i].tokenId,
            rate: parseFloat(formatEther(dataAvail[i].rentState.rate)),
            minConst: 60,
            maxConst: dataAvail[i].rentState.fixedMinutes * 60,
            fixedDuration: dataAvail[i].rentState.fixedMinutes,
            rateValue: dataAvail[i].rentState.rate,
            privateRental: dataAvail[i].rentState?.privateRental,
            whitelist: dataAvail[i].rentState?.whitelist,
            image: listArr[i].image,
            name: listArr[i].name,
          };

          available.push(val);
        }

        var data = Object.keys(rentedList).map((key) => rentedList[key]);

        let arr = {};
        let n = data.length;
        for (let i = 0; i < n; i++) {
          if (
            rentedList[i] &&
            rentedList[i].data &&
            rentedList[i].data.image === null
          ) {
            const meta = await getEVMMetadata(
              data[i].data.tokenAddress,
              data[i].data.tokenId
            );
            let response = {};
            if (meta.includes("https")) {
              /*uri = metadata;
          const data = {
            url: uri,
          };
          const result = await fetch(`${url}/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          response = await result.json();*/
            } else {
              const uri = meta.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
              const resp = await fetch(uri).then((r) => {
                r = r.json();
                return r;
              });
              response = resp;
              rentedList[i].data.metadata_link = uri;
              rentedList[i].data.name = resp.name;
            }
            if (!response.image.includes("https")) {
              rentedList[i].data.image = response.image.replace(
                "ipfs://",
                "https://hashpack.b-cdn.net/ipfs/"
              );
            }
          }

          let val = {
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
            explorerLink: `https://sepolia.etherscan.io/nft/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            magiceden: ``,
            opensea: `https://opensea.io/assets/ethereum/${rentedList[i].data.tokenAddress}/${rentedList[i].data.tokenId}`,
            metaDataLink: rentedList[i].data.metadata_link,
            owner: rentedList[i].initializer,
            token: data[i].data.tokenAddress,
            id: data[i].data.tokenId,
            rate: parseFloat(formatEther(data[i].data.rentState.rate)),
            minConst: 60,
            maxConst: data[i].data.rentState.fixedMinutes * 60,
            fixedDuration: data[i].data.rentState.fixedMinutes,
            rateValue: parseFloat(formatEther(data[i].data.rentState.rate)),
            image: rentedList[i].data.image,
            name: rentedList[i].data.name,
          };

          rented.push(val);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }

  let list = { available: available, rented: rented };
  return list;
};

export const sepoliaChain = "11155111";
export const telosChain = 41;

export function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
