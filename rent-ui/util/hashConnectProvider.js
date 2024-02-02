import { HashConnect } from "hashconnect";
import {
  AccountId,
  Client,
  NftId,
  TokenId,
  TokenNftInfoQuery,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenMintTransaction,
  PrivateKey,
  ContractCallQuery,
  Hbar,
  TransactionReceiptQuery,
} from "@hashgraph/sdk";
import { hederaContractId, hederaMainnetChainId, url } from "./common.js";
import { getContractAddress } from "test-multichain-sdk";

import { getAssetManagersByToken, getHederaSigner } from "test-multichain-sdk";

export const hashconnect = new HashConnect(true);
const networkType = "testnet";
const mainClient = Client.forTestnet();

const mirrornode = "https://testnet.mirrornode.hedera.com";
//const url = url;
let appMetadata = {
  name: "Stream NFT",
  description: "Platform to Loan/Borrow NFT.",
  icon: "/icon.png",
  uri: "http://localhost:3000",
};

let savedData = {
  topic: "",
  pairingStatus: "",
  privateKey: "",
  pairedWalletData: null,
  accountIds: [],
};

let savedDataTemplate = {
  topic: "",
  pairingStatus: "",
  privateKey: "",
  pairedWalletData: null,
  accountIds: [],
};


export const hashapackPairingData = () => {
  const length = JSON.parse(localStorage.getItem("hashconnectData")).pairingData
    .length;
  return JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
    length - 1
  ];
};

export const hederaData = async () => {
  return savedData;
};
export const initHashpack = async () => {
  let initData = await hashconnect.init(appMetadata, networkType, true);
};
export const pairHashpack = async () => {
  await initHashpack();
  hashconnect.findLocalWallets();
  hashconnect.foundExtensionEvent.once((extensionMetadata) => {
    hashconnect.connectToLocalWallet();
  });
  localStorage.setItem("connected", 1);
  //setConnected(true);
  hashconnect.pairingEvent.once((pairingData) => {
    pairingData.accountIds.forEach((id) => {
      if (savedData.accountIds.indexOf(id) === -1)
        savedData.accountIds.push(id);
    });

    return pairingData;
  });
};

export const unpairHashpack = async () => {
  if (savedData.topic) {
    hashconnect.disconnect(savedData.topic);
  }
  savedData = savedDataTemplate;
};

export const checkPairing = () => {
  return hashconnect.hcData.pairingData.length > 0;
};

export const getNFTImageURI = async (NFTID, id) => {
  const out = await fetch(
    `${mirrornode}/api/v1/tokens/${NFTID}/nfts/${id}`
  ).then((r) => {
    r = r.json();
    return r;
  });
  const newValue = Buffer.from(out.metadata, "base64");
  const metadata = newValue.toLocaleString();

  let uri = "";
  let response = {};
  if (metadata.includes("https")) {
    uri = metadata;
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
    response = await result.json();
  } else {
    if (metadata.includes("ipfs://")) {
      uri = metadata.replace("ipfs://", "https://hashpack.b-cdn.net/ipfs/");
    } else {
      uri = "https://hashpack.b-cdn.net/ipfs/" + metadata;
    }
    const resp = await fetch(uri).then((r) => {
      r = r.json();
      return r;
    });
    response = resp;
  }
  let image_url = "";
  if (response.image.includes("https")) {
    image_url = response.image;
  } else {
    image_url = response.image.replace(
      "ipfs://",
      "https://hashpack.b-cdn.net/ipfs/"
    );
  }
  return {
    image: image_url,
    name: response.name,
    metaDataLink: uri,
  };
};

export const getUserBalance = async () => {
  if (localStorage.getItem("hashconnectData")) {
    const length = JSON.parse(localStorage.getItem("hashconnectData"))
    .pairingData.length;
    const bal = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${
        JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
          .accountIds[0]
      }`
    )
      .then((r) => {
        r = r.json();
        return r;
      })
      .then((e) => {
        return parseFloat(e.balance.balance / 100000000).toFixed(2);
      });

    return bal;
  }
  return null;
};

export const getUserNftByCollection = async (tokenid) => {
  var nftH = [];
  if (JSON.parse(localStorage.getItem("hashconnectData"))) {
    const length = JSON.parse(localStorage.getItem("hashconnectData"))
      .pairingData.length;
    const response = await fetch(
      `${mirrornode}/api/v1/accounts/${
        JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
          length - 1
        ].accountIds[0]
      }/nfts/?token.id=${tokenid}`
    );
    const data = await response.json();
    if (data.length != 0) {
      nftH = await Promise.all(
        data.nfts.map(async (nft) => {
          const NFTImageURI = await getNFTImageURI(
            nft.token_id,
            nft.serial_number
          );
          nft.image = NFTImageURI.image;
          nft.name = NFTImageURI.name;
          nft.metaDataLink = NFTImageURI.metaDataLink;
          return nft;
        })
      );
    }
  }
  return nftH;
};

export const mintNft = async () => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
  .pairingData.length;
  const provider = hashconnect.getProvider(
    "testnet",
    JSON.parse(localStorage.getItem("hashconnectData")).topic,
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  );
  const signer = hashconnect.getSigner(provider);
  const mintTx = await new TokenMintTransaction()
    .setTokenId("0.0.4594876")
    .setMetadata([
      Buffer.from("QmXmAKtmLkn2QSSjerB8DERLArD7h5N2VdK5efXRHzH4Vp"),
    ])
    .freezeWithSigner(signer);
  let mintTxSign = await mintTx.signWithSigner(signer);
  let mintTxTra = await mintTxSign.executeWithSigner(signer);
  if (mintTxTra) {
    return "SUCCESS";
  }
  return "FAIL";
};

export const lendTokenHedera = async (
  nftAddress,
  userAddress,
  tokenId,
  ratePerMinute,
  validityMinutes,
  isFixed,
  fixedMinute,
  ownerShare
) => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
  .pairingData.length;
  const provider = hashconnect.getProvider(
    "testnet",
    JSON.parse(localStorage.getItem("hashconnectData")).topic,
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  );
  const signer = hashconnect.getSigner(provider);
  const contractID = await hederaContractId();
  const tx = await new AccountAllowanceApproveTransaction()
    .approveTokenNftAllowanceAllSerials(nftAddress, userAddress, contractID)
    .freezeWithSigner(signer);
  await tx.executeWithSigner(signer);

  const ratePerMinuteInt = Math.round(Number(ratePerMinute) * 100000000); // to convert to tinyHbar
  const _NFTAddress = AccountId.fromString(nftAddress).toSolidityAddress();

  const lendTokenTxn = await new ContractExecuteTransaction()
    .setContractId(contractID)
    .setGas(12000000)
    .setFunction(
      "lendToken",
      new ContractFunctionParameters()
        .addAddress(_NFTAddress) // NFT address
        .addUint256(Number(tokenId)) // NFT Serial Number
        .addUint256(Number(ratePerMinuteInt)) // Rate per minute
        .addUint256(Number(validityMinutes)) // Validity Minutes
        .addBool(isFixed) // isFixed
        .addUint256(Number(fixedMinute)) // Fixed minutes if that option was chosen, else 0
        .addUint256(Number(ownerShare)) // Owner Share
        .addBytes32("0x000000000000000000000000000000")
    );
  lendTokenTxn.freezeWithSigner(signer);
  //const signedLendToken = await lendTokenTxn.signWithSigner(signer);
  const transactionResponse = await lendTokenTxn.executeWithSigner(signer);

  let transactionQuery = null;
  let transactionReceipt = null;
  if (transactionResponse === undefined) {
    transactionQuery = new TransactionReceiptQuery().setTransactionId(
      lendTokenTxn._transactionIds.list[0].toString()
    );
  }
  if (transactionQuery) {
    transactionReceipt = await transactionQuery.execute(mainClient);
  }
  if (
    transactionResponse ||
    (transactionReceipt && transactionReceipt.status._code === 22)
  ) {
    // if success, then write to db
    const jsonBody = {
      assetManagerData: {
        chainId: hederaMainnetChainId,
        contractAddress: await getContractAddress(hederaMainnetChainId),
        tokenAddress: `0x${AccountId.fromString(nftAddress)
          .toSolidityAddress()
          .toString()}`,
        tokenId,
      },
      rentStateData: {
        rate: ratePerMinuteInt,
        validityMinutes,
        isFixed,
        fixedMinutes: fixedMinute,
        privateRental: false,
        doMint: false,
        ownerShare,
        initializer: `0x${AccountId.fromString(userAddress)
          .toSolidityAddress()
          .toString()}`,
      },
    };
    const writeDBResponse = await fetch(`${url}/listRent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    return "SUCCESS";
  }
  return "Failed";
};

export const processHederaRent = async (
  nftAddress,
  tokenId,
  payableAmount,
  durationInMinute
) => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
            .pairingData.length;
  const provider = hashconnect.getProvider(
    "testnet",
    JSON.parse(localStorage.getItem("hashconnectData")).topic,
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  );
  const userAddress = `0x${AccountId.fromString(
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  )
    .toSolidityAddress()
    .toString()}`;
  const signer = hashconnect.getSigner(provider);

  


  const rentNFTTxn = await new ContractExecuteTransaction()
    .setContractId(await hederaContractId())
    .setGas(1000000)
    .setPayableAmount(payableAmount)
    .setFunction(
      "processRent",
      new ContractFunctionParameters()
        .addAddress(nftAddress)
        .addUint256(Number(tokenId))
        .addUint256(Number(durationInMinute))
        .addBytes32Array(["0x000000000000000000000000000000"])
    );
  rentNFTTxn.freezeWithSigner(signer);
  //const signedProcessRent = await rentNFTTxn.signWithSigner(signer);
  const transactionResponse = await rentNFTTxn.executeWithSigner(signer);

  let transactionQuery = null;
  let transactionReceipt = null;
  if (transactionResponse === undefined) {
    transactionQuery = new TransactionReceiptQuery().setTransactionId(
      rentNFTTxn._transactionIds.list[0].toString()
    );
  }
  if (transactionQuery) {
    transactionReceipt = await transactionQuery.execute(mainClient);
  }
  if (
    transactionResponse ||
    (transactionReceipt && transactionReceipt.status._code === 22)
  ) {
    // if success, then write to db
    const jsonBody = {
      assetManagerData: {
        chainId: hederaMainnetChainId,
        contractAddress: await getContractAddress(hederaMainnetChainId),
        tokenAddress: `0x${AccountId.fromString(nftAddress)
          .toSolidityAddress()
          .toString()}`,
        tokenId,
      },
      rentStateData: {
        rentee: userAddress,
        durationInMunite: durationInMinute,
      },
    };
    const writeDBResponse = await fetch(`${url}/processRent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    return "SUCCESS";
    //if (writeDBResponse.ok) return "SUCCESS";
    //else return "Failed";
  }
  return "Failed";
};

export const expireHederaRent = async (nftAddress, tokenId) => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
  .pairingData.length;
  const provider = hashconnect.getProvider(
    "testnet",
    JSON.parse(localStorage.getItem("hashconnectData")).topic,
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  );
  const signer = hashconnect.getSigner(provider);

  const _NFTAddress = `0x${AccountId.fromString(nftAddress)
    .toSolidityAddress()
    .toString()}`;

  const expireRentTxn = await new ContractExecuteTransaction()
    .setContractId(await hederaContractId())
    .setGas(1000000)
    .setFunction(
      "expireRent",
      new ContractFunctionParameters()
        .addAddress(_NFTAddress)
        .addUint256(Number(tokenId))
    )
    .freezeWithSigner(signer);

  //const signedExpireRent = await expireRentTxn.signWithSigner(signer);

  const transactionResponse = await expireRentTxn.executeWithSigner(signer);

  let transactionQuery = null;
  let transactionReceipt = null;
  if (transactionResponse === undefined) {
    transactionQuery = new TransactionReceiptQuery().setTransactionId(
      expireRentTxn._transactionIds.list[0].toString()
    );
  }
  if (transactionQuery) {
    transactionReceipt = await transactionQuery.execute(mainClient);
  }
  if (
    transactionResponse ||
    (transactionReceipt && transactionReceipt.status._code === 22)
  ) {
    const jsonBody = {
      assetManagerData: {
        chainId: hederaMainnetChainId,
        contractAddress: await getContractAddress(hederaMainnetChainId),
        tokenAddress: _NFTAddress,
        tokenId: Number(tokenId),
      },
    };
    const writeDBResponse = await fetch(`${url}/expireRent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    return "SUCCESS";
  }
  return "Failed";
};

export const cancelHederaRent = async (nftAddress, tokenId) => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
  .pairingData.length;
  const provider = hashconnect.getProvider(
    "testnet",
    JSON.parse(localStorage.getItem("hashconnectData")).topic,
    JSON.parse(localStorage.getItem("hashconnectData")).pairingData[length-1]
      .accountIds[0]
  );
  const signer = hashconnect.getSigner(provider);
  const _NFTAddress = `0x${AccountId.fromString(nftAddress)
    .toSolidityAddress()
    .toString()}`;
  const cancelToken = await new ContractExecuteTransaction()
    .setContractId(await hederaContractId())
    .setGas(300000)
    .setFunction(
      "cancelLendToken",
      new ContractFunctionParameters()
        .addAddress(_NFTAddress)
        .addUint256(Number(tokenId))
    )
    .freezeWithSigner(signer);

  //const signedCancelRent = await createToken2.signWithSigner(signer);

  const transactionResponse = await cancelToken.executeWithSigner(signer);

  let transactionQuery = null;
  let transactionReceipt = null;
  if (transactionResponse === undefined) {
    transactionQuery = new TransactionReceiptQuery().setTransactionId(
      cancelToken._transactionIds.list[0].toString()
    );
  }
  if (transactionQuery) {
    transactionReceipt = await transactionQuery.execute(mainClient);
  }
  if (
    transactionResponse ||
    (transactionReceipt && transactionReceipt.status._code === 22)
  ) {
    const jsonBody = {
      assetManagerData: {
        chainId: hederaMainnetChainId,
        contractAddress: await getContractAddress(hederaMainnetChainId),
        tokenAddress: _NFTAddress,
        tokenId: Number(tokenId),
      },
    };
    const writeDBResponse = await fetch(`${url}/cancelRent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonBody),
    });
    return "SUCCESS";
  }
  return "Failed";
};

export const getRewardValue = async (solidityAddress, chain) => {
  let resp = 0;
  if (chain === 296 || chain === 295) {

    const hashconnectData = JSON.parse(localStorage.getItem("hashconnectData"));
  const accountIds =
    hashconnectData?.pairingData?.[0]?.accountIds?.[0];
    if (accountIds) {
      solidityAddress = "0x" + AccountId.fromString(accountIds)
        .toSolidityAddress()
        .toString();
  
      resp = await fetch(`${url}/reward/${solidityAddress}`).then((r) => r.json());
    } else {
      console.error("Error: Unable to access accountIds");
    }}
  else{
    resp = await fetch(`${url}/reward/${solidityAddress}`).then((r) => {
      r = r.json();
      return r;
    });
  }
  return resp;
};

export const getSolidityAddress = () => {
  const length = JSON.parse(localStorage.getItem("hashconnectData"))
      .pairingData.length;
    const userAddress = `0x${AccountId.fromString(
      JSON.parse(localStorage.getItem("hashconnectData")).pairingData[
        length - 1
      ].accountIds[0]
    )
      .toSolidityAddress()
      .toString()}`;

      return userAddress;
}