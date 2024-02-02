import React, { useContext } from "react";
import { useRouter } from "next/router";
import { ScrollHeaderContext } from "../../../context/ScrollHeaderContext";
import { Mixpanel } from "../../../util/mixpanel";

const Table = ({ collection, availableList }) => {
  const router = useRouter();

  const { setSelectedNft } = useContext(ScrollHeaderContext);

  return (
    <div
      className="relative rounded-3xl  overflow-x-auto  border-[4px] border-solid"
      style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
    >
      <div className="max-h-[550px] overflow-y-auto">
        <table className="w-full border-collapse  text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase whitespace-nowrap  w-full  dark:text-gray-400">
            <tr>
              {[
                "Collection Name",
                "Listed NFT",
                "Total Rented",
                "Available for Rent",
                "Floor Price",
              ].map((field, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-center font-numans font-normal text-sm h-16 sticky  top-0"
                  style={{
                    backgroundColor: "#1e1e1e",
                    borderTopLeftRadius: index === 0 ? "11px" : "0",
                    borderTopRightRadius: index === 4 ? "11px" : "0",
                    color: "#ffffff",
                  }}
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="items-center font-numans  w-full">
            {collection &&
              collection.map((item, index) => (
                <tr
                  className=" text-center font-medium text-sm"
                  style={{
                    height: 14,
                    wordBreak: "break-word",
                  }}
                  key={index}
                >
                  <td
                    style={{ display: "flex", height: "72px" }}
                    className="cursor-pointer"
                  >
                    <div
                      className="w-[280px] flex flex-row items-center justify-start gap-[8px]"
                      style={{ paddingLeft: "46px" }}
                      onClick={() => {
                        const formattedName = item.name
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-");
                        router.push(
                          `/${router.query.chain}/${formattedName}/myassets`
                        );
                        setSelectedNft(item.name);
                        Mixpanel.track("home_rentmkt_collection", {
                          collectionName: item.name,
                        });
                      }}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                          src={item.image ? item.image : item.image_url}
                          alt="#"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-row">
                        <h1 style={{ color: "white" }}>{item.name}</h1>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "white" }}>
                    {typeof availableList === "number"
                      ? availableList
                      : item.total_list
                      ? item.total_list
                      : 0}
                  </td>
                  <td style={{ color: "white" }}>
                    {item.active_rent ? item.active_rent : 0}
                  </td>

                  <td style={{ color: "#8FE6A4" }}>
                    {typeof availableList === "number"
                      ? availableList
                      : item.active_list
                      ? item.active_list
                      : 0}
                  </td>

                  <td style={{ color: "white" }}>
                    {router.query.chain === "solana" ? (
                      <h4>{item.floor} SOL </h4>
                    ) : router.query.chain === "hedera" ? (
                      <h4>{item.floor} HBAR </h4>
                    ) : router.query.chain === "telos" ? (
                      <h4>{item.floor} TLOS </h4>
                    ) : (
                      <h4>{item.floor} ETH </h4>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
