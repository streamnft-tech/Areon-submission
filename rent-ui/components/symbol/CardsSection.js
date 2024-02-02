import React from "react";
import { LendRentCard } from "../Reusables/Card/Card";
import { Wrapper } from "../../styles/symbol/cardsSection.styles";

const CardsSection = ({
  setModalType,
  cardsData,
  cardDatatype,
  setDataItem,
  msg,
  disable,
  loading,
}) => {
  return (
    <Wrapper>
      {loading ? (
        <div className="loader-wrapper">
          <div className="lds-dual-ring"></div>
          <p>Loading Data</p>
        </div>
      ) : (typeof cardsData === "undefined" || cardsData?.length <= 0) && msg !== "" ? (
        <div className="w-full m-auto h-14 flex items-center justify-center">
          <h1 className="text-2xl">{msg}</h1>
        </div>
      ) : cardsData?.length <= 0 ? (
        <h1>No Data Found</h1>
      ) : (
        cardsData?.map((item, index) => (
          <div className="flex gap-5 items-center justify-center" key={index}>
            <LendRentCard
              key={index}
              isHomeCard={false}
              img={item.image}
              name={item.name}
              owner={item.owner}
              data={item}
              buttonValue={item.buttonValue}
              setModalType={setModalType}
              setDataItem={setDataItem}
              disable={disable}
              cardDatatype={cardDatatype}

            />
          </div>
        ))
      )}
    </Wrapper>
  );
};

export default CardsSection;
