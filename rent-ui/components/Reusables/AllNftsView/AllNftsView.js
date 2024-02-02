import React from "react";
import Table from "./Table";

const AllNftsView = ({collection, availableList}) => {
  return (
    <div className="px-0 lg:px-[5rem] w-full items-center  ">
      <div>
        {/*collection.length > 0 && collection.map((item, index) => {
          return (
                  <div key={index} className="h-fit">*/}
            <div className="min-h-screen mt-8">
              {/* <NftTable collection={collection} availableList={availableList}/> */}
              <Table collection={collection} availableList={availableList}/>
            </div>
      </div>
    </div>
  );
};

export default AllNftsView;