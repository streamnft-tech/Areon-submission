import React, { useContext } from "react";
import styled from "styled-components";
import { ManageNav } from "../../context/ManageNavContext";
import Dropdown from "../Reusables/Dropdown/Dropdown";
import HorizontalSelect from "../Reusables/HorizontalSelect";
import SearchBar from "../Reusables/SearchBar/SearchBar";

export const Wrapper = styled.div`
  height: 150px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .leftBlock {
    display: flex;
    width: fit-content;
    align-items: center;
  }
`;

const CenterBar = () => {
  const {
    search,
    setSearch,
    filter,
    setFilter,
    centerSelect,
    setCenterSelect,
    rightSelect,
    setRightSelect,
  } = useContext(ManageNav);

  return (
    <Wrapper>
      <div className="leftBlock">
        <SearchBar
          placeholder="Search for collection"
          state={search}
          changeHandler={setSearch}
        />
        <Dropdown
          body={["Option One", "Option Two", "Option Three"]}
          state={filter}
          changeHandler={setFilter}
          height={"60px"}
          width={"150px"}
        />
      </div>
      <HorizontalSelect
        body={["Revenues", "Expenditures", "Transaction"]}
        state={centerSelect}
        changeHandler={setCenterSelect}
      />
      <HorizontalSelect
        body={["All", "Active", "Completed"]}
        state={rightSelect}
        changeHandler={setRightSelect}
      />
    </Wrapper>
  );
};

export default CenterBar;
