import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";

const SearchBar = ({ placeholder, state, changeHandler }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative flex flex-row items-center pr-2">
      <input
        className={`h-12 ${isExpanded?"px-4  w-48":"px-0 w-0"}  text-white rounded-l focus:outline-none transition-all duration-50`}
        style={{backgroundColor:"#292929"}}
        type="text"
        placeholder={  placeholder}
        value={state}
        onChange={(e) => changeHandler(e.target.value)}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
      />
      
      <button
        className={`h-12 w-12  focus:outline-none hover:bg-grey-1 transition-all duration-50 ${isExpanded? "rounded-r":"rounded"}`} style={{backgroundColor: "#292929"}}
        onClick={() => setIsExpanded((prevValue) => !prevValue)}
      >
        <IoSearch className="h-6 w-6 text-center mx-auto text-white"/>
      </button>
     
    </div>
  );
};

export default SearchBar;
