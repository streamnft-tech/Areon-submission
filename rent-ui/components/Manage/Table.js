import React from "react";
import { Wrapper } from "../../styles/manage/tableStyles";

const Table = ({ headers, rows }) => {
  return (
    <Wrapper>
      <div className="table-header">
        {headers.map((item, index) => (
          <div className={`table-elements ${item} `}>
            {item.replace("_", " ")}
          </div>
        ))}
      </div>

      {rows.map((row, index) => (
        <div className="table-row">
          {headers.map((header, index) => (
            <div
              className={`table-elements ${header} ${
                row[header] === "Completed" ? "complete" : ""
              } `}
            >
              {row[header]}
            </div>
          ))}
        </div>
      ))}
    </Wrapper>
  );
};

export default Table;
