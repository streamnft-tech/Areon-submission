import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM_ID } from "streamnft-sol/build/constants";
export const url = "https://devindexer.streamnft.tech";

import { getContractAddress } from "test-multichain-sdk";
import { telosChain,sepoliaChain } from "../services/reusableFunctions";

export const getRate = (timeScaleLocal, rateLocal) => {
  let value = 0;
  if (timeScaleLocal === "Hours") {
    value = 2;
  } else if (timeScaleLocal === "Minutes") {
    value = 1;
  } else if (timeScaleLocal === "Days") {
    value = 3;
  } else if (timeScaleLocal === "Weeks") {
    value = 4;
  } else if (timeScaleLocal === "Months") {
    value = 5;
  } else if (timeScaleLocal === "Years") {
    value = 6;
  }
  rateLocal = rateLocal * LAMPORTS_PER_SOL * 60;
  switch (value) {
    case 1:
      //minutes
      return rateLocal / 60;
    case 2:
      //hours
      return rateLocal / 3600;
    case 3:
      //days
      return rateLocal / 86400;
    case 4:
      //weeks
      return rateLocal / 604800;
    case 5:
      //months
      return rateLocal / 2592000;
    case 6:
      //years
      return rateLocal / 31536000;
    default:
      return rateLocal;
  }
};

export const getHederaRate = (timeScaleLocal, rateLocal) => {
  let value = 0;
  if (timeScaleLocal === "Hours") {
    value = 2;
  } else if (timeScaleLocal === "Minutes") {
    value = 1;
  } else if (timeScaleLocal === "Days") {
    value = 3;
  } else if (timeScaleLocal === "Weeks") {
    value = 4;
  } else if (timeScaleLocal === "Months") {
    value = 5;
  } else if (timeScaleLocal === "Years") {
    value = 6;
  }
  rateLocal = rateLocal * 60;
  switch (value) {
    case 1:
      //minutes
      return rateLocal / 60;
    case 2:
      //hours
      return rateLocal / 3600;
    case 3:
      //days
      return rateLocal / 86400;
    case 4:
      //weeks
      return rateLocal / 604800;
    case 5:
      //months
      return rateLocal / 2592000;
    case 6:
      //years
      return rateLocal / 31536000;
    default:
      return rateLocal;
  }
};

export const getEVMRate = (timeScaleLocal, rateLocal) => {
  let value = 0;

  if (timeScaleLocal === "Hours") {
    value = 2;
  } else if (timeScaleLocal === "Minutes") {
    value = 1;
  } else if (timeScaleLocal === "Days") {
    value = 3;
  } else if (timeScaleLocal === "Weeks") {
    value = 4;
  } else if (timeScaleLocal === "Months") {
    value = 5;
  } else if (timeScaleLocal === "Years") {
    value = 6;
  }

  switch (value) {
    case 1:
      // minutes
      return rateLocal / BigInt(60);
    case 2:
      // hours
      return rateLocal / BigInt(3600);
    case 3:
      // days
      return rateLocal / BigInt(86400);
    case 4:
      // weeks
      return rateLocal / BigInt(604800);
    case 5:
      // months
      return rateLocal / BigInt(2592000);
    case 6:
      // years
      return rateLocal / BigInt(31536000);
    default:
      console.warn("Unexpected timeScaleLocal:", timeScaleLocal);
      return rateLocal;
  }
};


export const getSeconds = (timeScaleLocal, rateLocal) => {
  let value = timeScaleLocal;
  if (timeScaleLocal === "Hours") {
    value = 2;
  } else if (timeScaleLocal === "Minutes") {
    value = 1;
  } else if (timeScaleLocal === "Days") {
    value = 3;
  } else if (timeScaleLocal === "Weeks") {
    value = 4;
  } else if (timeScaleLocal === "Months") {
    value = 5;
  } else if (timeScaleLocal === "Years") {
    value = 6;
  }
  switch (value) {
    case 1:
      //minutes
      return rateLocal * 60;
    case 2:
      //hours
      return rateLocal * 3600;
    case 3:
      //days
      return rateLocal * 86400;
    case 4:
      //weeks
      return rateLocal * 604800;
    case 5:
      //months
      return rateLocal * 2592000;
    case 6:
      //years
      return rateLocal * 31536000;
    default:
      return rateLocal;
  }
};

export const getMinutes = (timeScaleLocal, rateLocal) => {
  let value = timeScaleLocal;
  if (timeScaleLocal === "Hours") {
    value = 2;
  } else if (timeScaleLocal === "Minutes") {
    value = 1;
  } else if (timeScaleLocal === "Days") {
    value = 3;
  } else if (timeScaleLocal === "Weeks") {
    value = 4;
  } else if (timeScaleLocal === "Months") {
    value = 5;
  } else if (timeScaleLocal === "Years") {
    value = 6;
  }
  switch (value) {
    case 1:
      //minutes
      return rateLocal;
    case 2:
      //hours
      return rateLocal * 60;
    case 3:
      //days
      return rateLocal * 1440;
    case 4:
      //weeks
      return rateLocal * 10080;
    case 5:
      //months
      return rateLocal * 43800;
    case 6:
      //years
      return rateLocal * 525600;
    default:
      return rateLocal;
  }
};

export const scaleConvertion = (timeScaleLocal) => {
  if (timeScaleLocal === "Minutes") {
    return 1;
  } else if (timeScaleLocal === "Hours") {
    return 2;
  } else if (timeScaleLocal === "Days") {
    return 3;
  } else if (timeScaleLocal === "Weeks") {
    return 4;
  } else if (timeScaleLocal === "Months") {
    return 5;
  } else if (timeScaleLocal === "Years") {
    return 6;
  } else {
    return 0;
  }
};

export const timeString = (time) => {
  //time = time*60;
  let d = 0;
  let h = 0;
  let m = 0;
  let s = 0;
  let rs = "";
  if (time / 86400 > 0) {
    d = Math.floor(time / 86400);
    time = time % 86400;
    //rs += d + ":D ";
  }
  if (time / 3600 > 0) {
    h = Math.floor(time / 3600);
    time = time % 3600;
    //rs += h + ":H ";
  }
  if (time / 60 > 0) {
    m = Math.floor(time / 60);
    s = time % 60;
    //rs += m + ":M " +s + ":S";
  }
  if (d > 0) {
    rs += d + ":D ";
  }
  if (h > 0) {
    rs += h + ":H ";
  }
  if (m > 0) {
    rs += m + ":M ";
  }
  if (s > 0) {
    rs + s + ":S";
  }
  return rs;
};

export const getDuration = (time) => {
  let d = 0;
  let h = 0;
  let m = 0;
  let s = 0;
  let result = "";
  if (time / 86400 >= 1) {
    d = Math.floor(time / 86400);
    time = time % 86400;
    result += d + " Days ";
  }
  if (time / 3600 >= 1) {
    h = Math.floor(time / 3600);
    time = time % 3600;
    result += h + " Hours ";
  }
  if (time / 60 >= 1) {
    m = Math.floor(time / 60);
    s = time % 60;
    result += m + " Minutes ";
  }
  if (s > 0) {
    result += s + " Seconds";
  }
  return result;
};

export const getTimeForCard = (time) => {
  let d = 0;
  let h = 0;
  let m = 0;
  let result = "";
  if (time / 86400 >= 1) {
    d = Math.floor(time / 86400);
    time = time % 86400;
    result += d + " D ";
  }
  if (time / 3600 >= 1) {
    h = Math.floor(time / 3600);
    time = time % 3600;
    result += h + " H ";
  }
  if (time / 60 >= 1) {
    m = Math.floor(time / 60);
    time = time % 60;
    result += m + " M";
  }
  if (time > 0) {
    result += time + " S";
  }
  if (result === "") {
    return "0S";
  }
  return result;
};

export const getNearestTime = (time) => {
  let d = 0;
  let h = 0;
  let m = 0;
  let result = "";
  if (time / 86400 >= 1) {
    d = Math.floor(time / 86400);
    return d + " D ";
  }
  if (time / 3600 >= 1) {
    h = Math.floor(time / 3600);
    return h + " H ";
  }
  if (time / 60 >= 1) {
    time = time % 60;
    return m + " M";
  }
  if (time > 0) {
    return time + " S";
  }
  if (result === "") {
    return "0S";
  }
  return result;
};

export const getCardMaxTime = (time) => {
  let timeLeft = "";
  let now = new Date();

  var startOfDay = Math.floor(now / 1000);
  if (time < startOfDay) {
    return "0S";
  }
  var left = time - startOfDay;
  timeLeft = getNearestTime(left);
  return timeLeft;
};

export const getMaxTimeInSecond = (time) => {
  let timeLeft = "";
  let now = new Date();

  var startOfDay = Math.floor(now / 1000);
  if (time < startOfDay) {
    return "0";
  }
  var left = time - startOfDay;
  //var date = new Date(left*1000);
  return left;
};
export const getRatePerHour = (rate) => {
  return (rate * 60).toFixed(5);
};

export const calculateProfit = (rate, maxTime) => {
  if ((rate > 0, maxTime > 0)) {
    return (rate * maxTime * 60).toFixed(3);
  }
  return 0;
};

export const totalTimeLeft = (time) => {
  let timeLeft = "";
  let now = new Date();

  var startOfDay = Math.floor(now / 1000);
  if (time < startOfDay) {
    return "0S";
  }
  var left = time - startOfDay;
  //var date = new Date(left*1000);
  return left;
};

export const expiryTime = (time) => {
  let timeLeft = "";
  let now = new Date();

  var startOfDay = Math.floor(now / 1000);
  if (time < startOfDay) {
    return "0S";
  }
  var left = time - startOfDay;
  //var date = new Date(left*1000);
  timeLeft = timeString(left);
  return timeLeft;
};

export const sortarrayAsc = (arr, type) => {
  if (type === "p") {
    return arr.sort((a, b) => {
      return parseFloat(a.rate * a.maxConst) - parseFloat(b.rate * b.maxConst);
    });
  }
  if (type === "d") {
    return arr.sort((a, b) => {
      return parseFloat(a.maxConst) - parseFloat(b.maxConst);
    });
  }
};

export const sortarrayDes = (arr, type) => {
  if (type === "p") {
    return arr.sort((a, b) => {
      return parseFloat(b.rate * b.maxConst) - parseFloat(a.rate * a.maxConst);
    });
  }
  if (type === "d") {
    return arr.sort((a, b) => {
      return parseFloat(b.maxConst) - parseFloat(a.maxConst);
    });
  }
};

export const searchArray = (str, arr) => {
  const res = arr.filter((a) =>
    a.name.toLowerCase().includes(str.toLowerCase())
  );
  return res;
};

export const filterArray = (val, arr) => {
  return arr;
};

export const operatorKeyValue =
  "302e020100300506032b657004220420b62525638abde16666447a95ae76bbb945eab5bd6e74797a099e3403b6760903";
export const operatorIdValue = "0.0.90473";
export const hederaMainnetChainId = 296; // actually the testnet id, testing for now


export const hederaContractId = async () => await getContractAddress(2961);
// hedera testnet contract in accountId format

export const solanaTestnet = 0;
export const solanaContractAddress = PROGRAM_ID;


export const getHederaCollectionArray = async () => {
  const resp = await fetch(
    `${url}/collection/${hederaMainnetChainId}/${await getContractAddress(
      hederaMainnetChainId
    )}`
  ).then((r) => {
    r = r.json();
    return r;
  });
  return resp;
};


export const getSolanaCollectionArray = async () => {
  const resp = await fetch(
    `${url}/collection/${solanaTestnet}/${solanaContractAddress}`
  ).then((r) => {
    r = r.json();
    return r;
  });
  return resp;
};

export const getAvailabilityCount = async (tokenAddress) => {
  const resp = await fetch(
    `${url}/rent/${solanaTestnet}/${solanaContractAddress}/${tokenAddress}`
  ).then((r) => {
    r = r.json();
    return r;
  });
  return resp;
};

export const getChainSelection = (routerQueryChain) => {
  return routerQueryChain === "sepolia" ? sepoliaChain : routerQueryChain === "telos"? telosChain : 462;
};