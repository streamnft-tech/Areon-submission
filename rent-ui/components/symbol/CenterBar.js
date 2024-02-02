import React, { useState } from "react";
import { Wrapper } from "../../styles/symbol/centerBar.styles";
import Dropdown from "../Reusables/Dropdown/Dropdown";
import HorizontalSelect from "../Reusables/HorizontalSelect";
import SearchBar from "../Reusables/SearchBar/SearchBar";
import { Mixpanel } from "../../util/mixpanel";
import FilterBar from "../Reusables/FilterBar/FilterBar";

const CenterBar = ({
  showCenterBar = true,
  cardDatatype,
  setCardDatatype,
  selectBody,
  rightSelect,
  setRightSelect,
  search,
  setSearch,
  leftSelect,
  setLeftSelect,
}) => {
  const [centerSelect, setCenterSelect] = useState("Owned");

  return (
    <div className="flex flex-row md:items-center items-start justify-start md:justify-between w-full px-[3rem] gap-2 mt-[1.2rem] flex-wrap">
      <div className="flex flex-row items-center justify-between">
        <FilterBar
          placeholder="Search Here ..."
          state={search}
          changeHandler={setSearch}
        />
        <SearchBar
          placeholder="Search for NFT"
          state={search}
          changeHandler={setSearch}
        />
        </div>
        { /*<Dropdown
          body={["Duration", "Option Two", "Option Three"]}
          state={leftSelect}
          changeHandler={setLeftSelect}
          height={"60px"}
          width={"150px"}
  /> */}
      <div>
      {
        showCenterBar &&
        <HorizontalSelect
          body={selectBody}
          state={cardDatatype}
          changeHandler={(item) => {
            setCardDatatype(item);
            if (item === "Available") {
              Mixpanel.track("home_rentmkt_collection_rent_available");
            } else if (item === "Rented") {
              Mixpanel.track("home_rentmkt_collection_rent_rented");
            } else return;
          }}
        />

      }
      </div>
      <div className="justify-center items-center">
      <Dropdown
        body={[
          "Price: Low to High",
          "Price: High to Low",
          "Max Duration: Low to High",
          "Max Duration: High to Low",
        ]}
        state={rightSelect}
        changeHandler={setRightSelect}
        height={"60px"}
        width={"200px"}
      />
      </div>
    </div>
  );
};

export default CenterBar;
