import React, { useContext, useState } from "react";
import Modal from "../Modal";
import * as Styles from "./styles";
//named styles file diffrently because of the long name
import { useWallet } from "@solana/wallet-adapter-react";
import { ModalContext } from "../../../../context/ModalContext";

import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  cancelRent as cancelRentSolana,
  expireRent as expireRentSolana,
} from "streamnft-sol";
import { PublicKey } from "@solana/web3.js";
import {
  cancelHederaRent,
  expireHederaRent,
} from "../../../../util/hashConnectProvider";
import {
  cancelLendToken,
  expireRent,
  getWalletSigner,
} from "streamnft-evm-test";
import {
  sepoliaChain,
  solanaCancelRent,
  solanaExpireRent,
  wait,
  telosChain,
} from "../../../../services/reusableFunctions";
import { SepoliaContext } from "../../../../context/SepoliaContext";
import { getChainSelection } from "../../../../util/common";
const WithdrawModal = (cardsData) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { manage, setManage, manageCollection, setManageCollection } =
    useContext(SepoliaContext);
  const { setOpenModal } = useContext(ModalContext);
  const [point, setPoint] = useState(router.query.chain === "hedera" ? 0 : 4);
  const text =
    router.query.chain === "hedera"
      ? "HBAR"
      : router.query.chain === "solana"
      ? "SOL" :
      router.query.chain === "telos" ? "TLOS"
      : router.query.chain === "areon" ? "TAREA"
      : "ETH";
  const withdrawCall = async () => {
    setLoading(true);
    if (router.query.chain === "solana") {
      try {
        const nftMint = new PublicKey(cardsData.cardsData.id);

        expireRentSolana(nftMint)
          .then(async (val) => {
            if (val) {
              await wait(20);
              await solanaExpireRent(cardsData.cardsData.id);
              //await wait(5);

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
            setLoading(false);
            toast.error(e);
          });
      } catch (e) {
        setLoading(false);
        toast.error(e);
      }
    }
    else if (router.query.chain === "hedera") {
      try {
        const res = await expireHederaRent(
          cardsData.cardsData.token,
          cardsData.cardsData.id
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
        toast.error(
          "NFT is rented out at the moment. Please try to withdraw after rental expiry."
        );
        setLoading(false);
      }
    }
   else {
      const chainSelection = getChainSelection(router.query.chain);
      try {
        const walletSigner = await getWalletSigner().then((res) => {
          return res;
        });
        const res = await expireRent(
          cardsData.cardsData.token,
          cardsData.cardsData.id,
          chainSelection,
          walletSigner
        );
        if (res && res.hash) {
          await wait(5);
          toast.success("Transaction Successful");
          setLoading(false);
          setOpenModal(false);
          setManage(!manage);
          setManageCollection(!manageCollection);
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
  };

  return (
    <Modal
      headerText="Withdraw Details"
      buttonText="Withdraw"
      buttonHandler={() => withdrawCall()}
    >
      {loading ? (
        <div className="loader-wrapper">
          <div className="lds-dual-ring"></div>
          <p>Withdrawing NFT</p>
        </div>
      ) : (
        <Styles.Wrapper>
          <div className="image-container">
            <img
              src={cardsData.cardsData.image}
              alt={cardsData.cardsData.name}
            />
            <h5 className="collection-name">{cardsData.cardsData.name}</h5>
            <span>Duration: 3D</span>
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
                  {cardsData.cardsData.ownerShare && 
                  Number(cardsData.cardsData.ownerShare) !== 100 &&
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
              <tr>
                {(Number(cardsData.cardsData.ownerShare) !== 100 &&
                  Number(cardsData.cardsData.ownerShare) !== 0 &&
                  Number(cardsData.cardsData.rate) > 0) ||
                Number(cardsData.cardsData.rate) > 0 ? (
                  <>
                    <th>Rent Price</th>
                    <td>
                      {text}
                      <span className="mx-1">
                        {(cardsData.cardsData.rate * 60).toFixed(point)}
                      </span>
                      / Hour
                    </td>{" "}
                  </>
                ) : (
                  <>
                    <th>Reward Share Owner</th>
                    <td>
                      <span className="mx-1">
                        {cardsData.cardsData.ownerShare}%
                      </span>
                    </td>
                    <th>Reward Share Renter</th>
                    <td>
                      <span className="mx-1">
                        {100 - Number(cardsData.cardsData.ownerShare)}%
                      </span>
                    </td>
                  </>
                )}
              </tr>
              {cardsData.cardsData.rentType === "Variable" ? (
                <tr>
                  <th>Max Duration</th>
                  <td>{cardsData.cardsData.timeLeft} </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <th> Rent Duration</th>
                    <td>{cardsData.cardsData.maxTimeString} </td>
                  </tr>
                  <tr>
                    <th>Duration</th>
                    <td>{cardsData.cardsData.timeLeft} </td>
                  </tr>
                </>
              )}
              <tr>
                <th>Available Duration</th>
                <td>{cardsData.cardsData.timeLeft} </td>
              </tr>
              <tr>
                <th>Rental Time Left</th>
                <td>{cardsData.cardsData.timeLeft} </td>
              </tr>
              <tr>
                <th>Total Profits </th>
                <td>
                  {router.query.chain === "solana" ? (
                    <p>{cardsData.cardsData.profit} SOL</p>
                  ) : router.query.chain === "hedera" ? (
                    <p>{cardsData.cardsData.profit || 0} HBAR</p>
                  ) : (
                    <p>{cardsData.cardsData.profit} ETH</p>
                  )}
                </td>
              </tr>
            </table>
            <div className="content-row"></div>
          </div>
        </Styles.Wrapper>
      )}
    </Modal>
  );
};
const CancelModal = (cardsData) => {
  const wallet = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [point, setPoint] = useState(router.query.chain === "hedera" ? 0 : 4);
  const text =
  router.query.chain === "hedera"
    ? "HBAR"
    : router.query.chain === "solana"
    ? "SOL" :router.query.chain === "telos" ? "TLOS"
    : router.query.chain === "areon" ? "TAREA"
    : "ETH";
  const { manage, setManage, manageCollection, setManageCollection } =
    useContext(SepoliaContext);
  const { setOpenModal } = useContext(ModalContext);
  const cancelNFT = async () => {
    setLoading(true);
    if (router.query.chain === "solana") {
      try {
        const nftMint = new PublicKey(cardsData.cardsData.id);
        cancelRentSolana(nftMint)
          .then(async (val) => {
            if (val) {
              await solanaCancelRent(
                cardsData.cardsData.id,
                cardsData.cardsData.token,
                wallet.publicKey
              );
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
            setLoading(false);
            toast.error(e);
          });
      } catch (e) {
        setLoading(false);
        toast.error(e);
      }
    }
    else if (router.query.chain === "hedera") {
      try {
        const res = await cancelHederaRent(
          cardsData.cardsData.token,
          cardsData.cardsData.id
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
    else{
      const chainSelection = getChainSelection(router.query.chain);
      try {
        const walletSigner = await getWalletSigner().then((res) => {
          return res;
        });
        const res = await cancelLendToken(
          cardsData.cardsData.token,
          cardsData.cardsData.id,
          chainSelection,
          walletSigner
        );
        if (res && res.hash) {
          await wait(5);
          toast.success("Transaction Successful");
          setLoading(false);
          setOpenModal(false);
          setManage(!manage);
          setManageCollection(!manageCollection);
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
  };

  return (
    <Modal
      headerText="Cancel Details"
      buttonText="Cancel"
      buttonHandler={() => cancelNFT()}
    >
      {loading ? (
        <div className="loader-wrapper">
          <div className="lds-dual-ring"></div>
          <p>Cancelling NFT listing</p>
        </div>
      ) : (
        <Styles.Wrapper>
          <div className="image-container">
            <img
              src={cardsData.cardsData.image}
              alt={cardsData.cardsData.name}
            />
            <h5 className="collection-name">{cardsData.cardsData.name}</h5>
            <span>Duration: {cardsData.cardsData.timeLeft}</span>
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
                  {cardsData.cardsData.ownerShare &&
                  Number(cardsData.cardsData.ownerShare) !== 100 &&
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
              
                {(Number(cardsData.cardsData.ownerShare) !== 100 &&
                  Number(cardsData.cardsData.ownerShare) !== 0 &&
                  Number(cardsData.cardsData.rate) > 0) ||
                Number(cardsData.cardsData.rate) > 0 ? (
                  <tr>
                    <th>Rent Price</th>
                    <td>
                      {text}
                      <span className="mx-1">
                        {(cardsData.cardsData.rate * 60).toFixed(point)}
                      </span>
                      / Hour
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
                  <th>Max Duration</th>
                  <td>{cardsData.cardsData.timeLeft} </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <th>Duration</th>
                    <td>{cardsData.cardsData.timeLeft} </td>
                  </tr>
                </>
              )}
              <tr>
                <th>Available Duration</th>
                <td>{cardsData.cardsData.timeLeft} </td>
              </tr>
              <tr>
                <th>Total Profits </th>
                <td>
                  {router.query.chain === "solana" ? (
                    <p>{cardsData.cardsData.profit} SOL</p>
                  ) : router.query.chain === "hedera" ? (
                    <p>{cardsData.cardsData.profit || 0} HBAR</p>
                  ) : (
                    <p>{cardsData.cardsData.profit} ETH</p>
                  )}
                </td>
              </tr>
            </table>
          </div>
        </Styles.Wrapper>
      )}
    </Modal>
  );
};
const RevokeModal = () => {
  return (
    <Modal headerText="Revoke Details" buttonText="Revoke">
      <Styles.Wrapper>
        <img src="/images/gun.png" alt="" />

        <div className="content-section">
          <div className="content-row">
            <h5>Contract Type</h5>
            <p>Fixed price</p>
          </div>
          <div className="content-row">
            <h5>Duration</h5>
            <p>10 Days</p>
          </div>
          <div className="content-row">
            <h5>Rent Price</h5>
            <p> 40% : 60% ( Owner : Renter )</p>
          </div>
          <div className="content-row">
            <h5>Available for </h5>
            <p>XD: YH: ZM: AS </p>
          </div>
          <div className="content-row">
            <h5>Rental Period </h5>
            <h5>XD: YH: ZM: AS</h5>
          </div>
          <div className="content-row">
            <h5>Revenue Generated </h5>
            {router.query.chain === "solana" ? (
              <p>SOL XYZ</p>
            ) : router.query.chain === "hedera" ? (
              <p>HBAR XYZ</p>
            ) : (
              <p>ETH XYZ</p>
            )}
          </div>
        </div>
      </Styles.Wrapper>
    </Modal>
  );
};

export { WithdrawModal, CancelModal, RevokeModal };
