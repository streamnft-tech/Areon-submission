import React, { Fragment, useEffect, useState, useContext } from "react";
import Modal from "../Modal";
import * as Styles from "./rentModalStyles";
import { processRent as processSolanaRent } from "streamnft-sol";
import Dropdown from "../../Dropdown/Dropdown";
import { getMinutes, getSeconds, url } from "../../../../util/common";
import Router, { useRouter } from "next/router";
import { toast } from "react-toastify";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { Mixpanel } from "../../../../util/mixpanel";
import {
  getSolidityAddress,
  processHederaRent,
} from "../../../../util/hashConnectProvider";
import { processRent, getWalletSigner } from "streamnft-evm-test";
import {
  sepoliaChain,
  solanaProcessRent,
  wait,
  telosChain,
} from "../../../../services/reusableFunctions";
import { SepoliaContext } from "../../../../context/SepoliaContext";
import { ModalContext } from "../../../../context/ModalContext";
import { getChainSelection } from "../../../../util/common";

const RentModal = (cardsData) => {
  const [duration, setDuration] = useState(0);
  const [timeScale, setTimeScale] = useState("Hours");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [disable, setDisable] = useState(true);
  const router = useRouter();

  const [point, setPoint] = useState(router.query.chain === "hedera" ? 2 : 4);
  const [rentRate, setRentRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const text =
    router.query.chain === "hedera"
      ? "HBAR"
      : router.query.chain === "solana"
      ? "SOL" : 
      router.query.chain === "telos" ? "TLOS"
      : router.query.chain === "areon" ? "TAREA"
      : "ETH";

  const { manage, setManage, manageCollection, setManageCollection } =
    useContext(SepoliaContext);
  const { setOpenModal } = useContext(ModalContext);

  useEffect(() => {
    if (cardsData.cardsData.rentType === "Fixed") {
      if (cardsData.cardsData.maxTimeString === "") {
        setRentRate(0);
      } else {
        const [fixedDurationValue, fixedDurationTimescale] =
          cardsData.cardsData.maxTimeString.split(":");
        const fixedDuration = Number(fixedDurationValue);
        const hourlyRate = Number(cardsData.cardsData.ratePerHour);
        setRentRate(
          fixedDurationTimescale === "H"
            ? hourlyRate * fixedDuration
            : hourlyRate * fixedDuration * 24
        );
      }
      setDisable(false);
    } else {
      setRentRate(0);
      setDisable(true);
    }
    getDiscount();
    setMsg("");
  }, [cardsData]);

  const getDiscount = async () => {
    const values = await fetch(`${url}/nftdiscount/296/1/RENT`);
    const userAddress = getSolidityAddress();
    //const discount = await fetch(`${url}/nftdiscount/${hederaMainnetChainId}/${userAddress}/RENT`);
    const discount = await values.json();
    if (discount[0] && discount[0].discount && discount[0].discount > 0) {
      setDiscount(discount[0].discount);
    }
  };
  const rentCall = async () => {
    setLoading(true);

    if (router.query.chain === "solana") {
      try {
        Mixpanel.track(
          "home_rentmkt_collection_rent_available_nft_rent_button_rent_now"
        );
        let durationInMint = 0;
        if (cardsData.cardsData.rentType === "Fixed") {
          durationInMint = cardsData.cardsData.fixedDuration;
        } else {
          durationInMint = getMinutes(timeScale, duration);
        }
        let price = 0;
        let totalRate = 0;
        if (cardsData.cardsData.rentType === "Fixed") {
          price =
            cardsData.cardsData.fixedDuration * cardsData.cardsData.rateValue;
          totalRate = cardsData.cardsData.rateValue;
        } else {
          price = cardsData.cardsData.rate * getSeconds(timeScale, duration);
          totalRate =
            cardsData.cardsData.rateValue * getSeconds(timeScale, duration);
        }
        const nftMint = new PublicKey(cardsData.cardsData.id);
        processSolanaRent(new BN(durationInMint), nftMint, nftMint)
          .then(async (val) => {
            if (val) {
              await wait(15);
              await solanaProcessRent(cardsData.cardsData.id);
              toast.success("Transaction Successful");
              setLoading(false);
              setOpenModal(false);
              cardsData.setUserTransacted(true);
            } else {
              toast.error("Transaction Failed");
              setLoading(false);
            }
          })
          .catch((e) => {
            console.error(e);
            toast.error(e.message);
            setLoading(false);
          });
      } catch (e) {
        console.error(e);
        toast.error(e.message);
        setLoading(false);
      }
    }
    else if (router.query.chain === "hedera") {
      try {
        let durationInMint = 0;

        if (cardsData.cardsData.rentType === "Fixed") {
          durationInMint = cardsData.cardsData.fixedDuration;
        } else {
          durationInMint = getMinutes(timeScale, duration);
        }

        const rateWithInterest =
          cardsData.cardsData.rateValue + (cardsData.cardsData.rateValue * 0.1 * (100-discount)/100);

        let payableAmount = (rateWithInterest * durationInMinute) / 100000000;
        const res = await processHederaRent(
          cardsData.cardsData.token,
          cardsData.cardsData.id,
          payableAmount,
          durationInMinute
        );
        if (res === "SUCCESS") {
          await wait(5);
          toast.success("Transaction Successful");
          setLoading(false);
          setOpenModal(false);
          cardsData.setUserTransacted(true);
        } else {
          toast.error("Something went wrong");
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
        setLoading(false);
      }
    }
    else {
      const chainSelection = getChainSelection(router.query.chain);
      try {
        let durationInMint = 0;

        if (cardsData.cardsData.rentType === "Fixed") {
          durationInMint = cardsData.cardsData.fixedDuration;
        } else {
          durationInMint = getMinutes(timeScale, duration);
        }
        const walletSigner = await getWalletSigner().then((res) => {
          return res;
        });
        const res = await processRent(
          cardsData.cardsData.token,
          cardsData.cardsData.id,
          durationInMint,
          chainSelection,
          walletSigner
        );
        if (res && res.hash) {
          await wait(10);
          toast.success("Transaction Successful");
          setLoading(false);
          setOpenModal(false);
          setManage(!manage);
          setManageCollection(!manageCollection);
        } else {
          console.error(res);
          toast.error("Something went wrong");
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message);
        setLoading(false);
      }
    }
  };

  const calculateRate = (value) => {
    setDuration(value);
    if (
      getSeconds(timeScale, value) <= cardsData.cardsData.maxTimeInSecond &&
      getSeconds(timeScale, value) >= cardsData.cardsData.minConst
    ) {
      const price = (
        (value * getSeconds(timeScale, cardsData.cardsData.rate)) /
        60
      ).toFixed(point);
      let token =
        router.query.chain === "solana"
          ? "SOL"
          : router.query.chain === "hedera"
          ? "HBAR"
          : router.query.chain === "areon" ? "TAREA"
          : "ETH";
      setRentRate(price);
      setMsg("");
      setDisable(false);
    } else {
      setDisable(true);
      setMsg("Invalid duration");
    }
  };

  return (
    <Modal
      headerText="Rent Details"
      buttonText="Rent"
      error={msg}
      buttonIcon={
        <svg
          width="20"
          height="18"
          viewBox="0 0 20 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.51259 0.996835C1.41882 0.621781 1.03876 0.393757 0.663706 0.48753C0.288651 0.581303 0.0606275 0.961362 0.1544 1.33642L1.51259 0.996835ZM4.80486 13.4878L5.22563 12.9283L4.80486 13.4878ZM2.51791 8.04308L3.19863 7.87993L2.51791 8.04308ZM4.65494 13.3695L5.10089 12.83L4.65494 13.3695ZM18.3495 8.45208L19.0302 8.61522L18.3495 8.45208ZM16.5749 13.1312L16.0846 12.6317L16.5749 13.1312ZM15.8671 13.6894L16.2386 14.2827L15.8671 13.6894ZM18.2852 5.12994L18.7657 4.62085L18.2852 5.12994ZM18.5867 5.51217L19.1937 5.16361L18.5867 5.51217ZM11.6669 7.96663C11.2803 7.96663 10.9669 8.28003 10.9669 8.66663C10.9669 9.05322 11.2803 9.36663 11.6669 9.36663V7.96663ZM14.1669 10.4666C13.7803 10.4666 13.4669 10.78 13.4669 11.1666C13.4669 11.5532 13.7803 11.8666 14.1669 11.8666V10.4666ZM1.71077 5.3754H15.371V3.9754H1.71077V5.3754ZM10.9033 13.6245H10.4827V15.0245H10.9033V13.6245ZM3.19863 7.87993L2.3915 4.51225L1.03005 4.83855L1.83718 8.20623L3.19863 7.87993ZM2.38987 4.50561L1.51259 0.996835L0.1544 1.33642L1.03168 4.84519L2.38987 4.50561ZM10.4827 13.6245C8.94439 13.6245 7.85068 13.6234 7.00045 13.5246C6.16793 13.4278 5.64565 13.2443 5.22563 12.9283L4.3841 14.0472C5.07658 14.568 5.87144 14.8028 6.83883 14.9152C7.7885 15.0256 8.97746 15.0245 10.4827 15.0245V13.6245ZM1.83718 8.20623C2.18801 9.67002 2.46405 10.8265 2.79272 11.7243C3.12753 12.6388 3.5411 13.3571 4.20899 13.9091L5.10089 12.83C4.69578 12.4951 4.39552 12.03 4.1074 11.243C3.81314 10.4392 3.55716 9.37588 3.19863 7.87993L1.83718 8.20623ZM5.22563 12.9283C5.1833 12.8965 5.14171 12.8637 5.10089 12.83L4.20899 13.9091C4.2663 13.9565 4.32468 14.0025 4.3841 14.0472L5.22563 12.9283ZM10.9033 15.0245C12.2056 15.0245 13.2343 15.0253 14.0626 14.9416C14.9051 14.8564 15.6059 14.6789 16.2386 14.2827L15.4957 13.0961C15.114 13.3351 14.6494 13.4751 13.9218 13.5487C13.1801 13.6237 12.234 13.6245 10.9033 13.6245V15.0245ZM16.0846 12.6317C15.9056 12.8073 15.7082 12.9631 15.4957 13.0961L16.2386 14.2827C16.537 14.0959 16.8141 13.8773 17.0653 13.6307L16.0846 12.6317ZM15.371 5.3754C16.2 5.3754 16.7576 5.37663 17.1709 5.42706C17.5726 5.47608 17.7214 5.56038 17.8048 5.63903L18.7657 4.62085C18.3674 4.24496 17.87 4.10198 17.3404 4.03737C16.8224 3.97416 16.1637 3.9754 15.371 3.9754V5.3754ZM19.0302 8.61522C19.215 7.84436 19.3697 7.20404 19.4289 6.68559C19.4895 6.15558 19.4664 5.63855 19.1937 5.16361L17.9796 5.86072C18.0367 5.9601 18.084 6.1245 18.038 6.5266C17.9907 6.94026 17.862 7.48273 17.6688 8.28893L19.0302 8.61522ZM17.8048 5.63903C17.8736 5.70397 17.9325 5.77867 17.9796 5.86072L19.1937 5.16361C19.0784 4.96271 18.9341 4.77984 18.7657 4.62085L17.8048 5.63903ZM17.5002 10.4666H14.1669V11.8666H17.5002V10.4666ZM18.298 7.96663L11.6669 7.96663V9.36663L18.298 9.36663V7.96663ZM17.6688 8.28893C17.6514 8.36147 17.6342 8.43292 17.6174 8.50334L18.9787 8.82991C18.9957 8.75933 19.0128 8.68775 19.0302 8.61522L17.6688 8.28893ZM17.6174 8.50334C17.3692 9.538 17.1769 10.3247 16.9759 10.9536L18.3095 11.3797C18.5293 10.6919 18.7337 9.85136 18.9787 8.82991L17.6174 8.50334ZM16.9759 10.9536C16.7061 11.7981 16.4437 12.2792 16.0846 12.6317L17.0653 13.6307C17.6603 13.0467 18.0105 12.3154 18.3095 11.3797L16.9759 10.9536ZM17.5002 11.8666H17.6427V10.4666H17.5002V11.8666Z"
            fill="#F1FCF3"
          />
          <path
            d="M8.72851 16.9561C8.72851 17.4405 8.33577 17.8332 7.85131 17.8332C7.36685 17.8332 6.97412 17.4405 6.97412 16.9561C6.97412 16.4716 7.36685 16.0789 7.85131 16.0789C8.33577 16.0789 8.72851 16.4716 8.72851 16.9561Z"
            fill="#F1FCF3"
          />
          <path
            d="M13.9917 16.9561C13.9917 17.4405 13.5989 17.8332 13.1145 17.8332C12.63 17.8332 12.2373 17.4405 12.2373 16.9561C12.2373 16.4716 12.63 16.0789 13.1145 16.0789C13.5989 16.0789 13.9917 16.4716 13.9917 16.9561Z"
            fill="#F1FCF3"
          />
        </svg>
      }
      buttonHandler={() => rentCall()}
      disable={disable}
    >
      <Styles.Wrapper>
        {loading ? (
          <div className="loader-wrapper">
            <div className="lds-dual-ring"></div>
            <p>Renting NFT</p>
          </div>
        ) : (
          <Fragment>
            <div className="image-container">
              <img
                src={cardsData.cardsData.image}
                alt={cardsData.cardsData.name ?
                  cardsData.cardsData.name.length > 28
                    ? cardsData.cardsData.name.substring(0, 30)
                    : cardsData.cardsData.name : "name"
                }
              />
              <h5 className="collection-name">
                {cardsData.cardsData.name ? cardsData.cardsData.name.length > 28
                  ? cardsData.cardsData.name.substring(0, 30) + "..."
                  : cardsData.cardsData.name : ""}
              </h5>
              <span>Duration: {cardsData.cardsData.duration}</span>
              <span>
                <span className="owner-address-label">Owner: </span>
                <span className="owner-address-value">
                  {cardsData.cardsData.owner}
                </span>
              </span>
            </div>
            <div className="content-section">
              <table>
                <tr>
                  <th>Contract Type</th>
                  <td>
                    {Number(cardsData.cardsData.ownerShare) !== 100 &&
                    cardsData.cardsData.ownerShare &&
                    Number(cardsData.cardsData.ownerShare) !== 0 &&
                    Number(cardsData.cardsData.rate) > 0
                      ? " Hybrid"
                      : Number(cardsData.cardsData.rate) > 0
                      ? "Fixed Price"
                      : "Reward Sharing"}
                  </td>
                </tr>
                <tr>
                  <th>Rent Type</th>
                  <td>
                    {cardsData.cardsData.rentType === "Variable"
                      ? "Max Duration"
                      : "Fixed Duration"}
                  </td>
                </tr>
                {cardsData.cardsData.ownerShare && 
                (Number(cardsData.cardsData.ownerShare) !== 100 &&
                  Number(cardsData.cardsData.ownerShare) !== 0 &&
                  Number(cardsData.cardsData.rate) > 0) ||
                Number(cardsData.cardsData.rate) > 0 ? (
                  <tr>
                    <th>Rent Price</th>
                    <td>
                      <span className="mx-1">
                        {(cardsData.cardsData.rate * 60).toFixed(point)}
                      </span>
                      {text} / Hour
                    </td>{" "}
                  </tr>
                ) : (
                  <>
                    <tr>
                      <th>Reward Share Owner</th>
                      <td>
                        <span className="mx-1">
                          {cardsData.cardsData.ownerShare}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Reward Share Renter</th>
                      <td>
                        <span className="mx-1">
                          {100 - Number(cardsData.cardsData.ownerShare)}%
                        </span>
                      </td>
                    </tr>
                  </>
                )}
                {cardsData.cardsData.rentType === "Variable" ? (
                  <tr>
                    <th>Max duration</th>
                    <td>{cardsData.cardsData.timeLeft} </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <th> Rent Duration</th>
                      <td>{cardsData.cardsData.maxTimeString} </td>
                    </tr>
                    <tr>
                      <th>Available Duration</th>
                      <td>{cardsData.cardsData.timeLeft} </td>
                    </tr>
                  </>
                )}
              </table>
              <div className="flex flex-row gap-x-4">
                {cardsData.cardsData.rentType === "Variable" ? (
                  <div className="half-input-wrapper">
                    <h5
                      className="mt-5 mb-2 px-3 text-white"
                      style={{ fontFamily: "Numans" }}
                    >
                      Duration
                    </h5>
                    <div className="duration-input-wrapper ">
                      <input
                        type="number"
                        placeholder="Duration"
                        onChange={(e) => {
                          calculateRate(e.target.value);
                          setTimeout(() => {
                            Mixpanel.track(
                              "home_rentmkt_collection_rent_available_nft_rent_button_duration",
                              { typedData: e.target.value }
                            );
                          }, 1000);
                        }}
                      />
                      <div className="seperator"></div>
                      <Dropdown
                        body={["Hours", "Days", "Months"]}
                        state={timeScale}
                        changeHandler={setTimeScale}
                        height={"60px"}
                        width={"90px"}
                        noBorder={true}
                        className="pb-4 bg-none"
                        noBackground={true}
                      />
                    </div>
                  </div>
                ) : null}
                {Number(cardsData.cardsData.rate) > 0 ? (
                  <div className="half-input-wrapper">
                    <h5
                      className="mt-5 mb-2 px-3 text-white"
                      style={{ fontFamily: "Numans" }}
                    >
                      Rent Price
                    </h5>
                    <div className="duration-input-wrapper ">
                      <input
                        disabled
                        placeholder="Auto-Calculate"
                        value={rentRate}
                      />
                      <div className="seperator"></div>
                      {router.query.chain === "solana" ? (
                        <h5 className="cursor-pointer text-white !text-sm ml-2">
                          {" "}
                          SOL{" "}
                        </h5>
                      ) : router.query.chain === "hedera" ? (
                        <h5 className="cursor-pointer text-white !text-sm ml-2">
                          {" "}
                          HBAR{" "}
                        </h5>
                      ) : router.query.chain === "telos" ? (
                        <h5 className="cursor-pointer text-white !text-sm ml-2">
                          {" "}
                          TLOS{" "}
                        </h5>
                      ) :
                      (router.query.chain === "areon" ?  (
                        <h5 className="cursor-pointer text-white !text-sm ml-2">
                          {" "}
                          TAREA{" "}
                        </h5>) : 
                        <h5 className="cursor-pointer text-white !text-sm ml-2">
                          {" "}
                          ETH{" "}
                        </h5>
                      )}
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </Fragment>
        )}
      </Styles.Wrapper>
    </Modal>
  );
};

export default RentModal;
