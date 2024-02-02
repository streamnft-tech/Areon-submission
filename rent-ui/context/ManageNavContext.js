import { createContext, useState } from "react";

export const ManageNav = createContext();

const ManageNavWrapper = ({ children }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Option One");
  const [centerSelect, setCenterSelect] = useState("Revenues");
  const [rightSelect, setRightSelect] = useState("All");

  return (
    <ManageNav.Provider
      value={{
        search,
        setSearch,
        filter,
        setFilter,
        centerSelect,
        setCenterSelect,
        rightSelect,
        setRightSelect,
      }}
    >
      {children}
    </ManageNav.Provider>
  );
};

export default ManageNavWrapper;
