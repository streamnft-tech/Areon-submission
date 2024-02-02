import React from "react";
import styled from "styled-components";
import GradientBorder from "./GradientBorder";

const Wrapper = styled.div`
  height: 52px;
  width: fit-content;
  display: flex;
  padding: 0 25px;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  background: #292929;
  border-radius: 6px;
`;
const Items = styled.div`
  height: 100%;
  width: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  column-gap: 16px;

  h5 {
    font-family: Numans;
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: ${(props) => (props.selected ? "#30B750" : "#fff")};
    transition: all 0.2s ease-in;
  }

  .indicator {
    height: 5px;
    width: 5px;
    background: #30B750;
    border-radius: 50%;
    opacity: ${(props) => (props.selected ? "1" : "0")};
    visibility: ${(props) => (props.selected ? "visible" : "hidden")};
    transition: all 0.2s ease-in;
  }
`;

const HorizontalSelect = ({ body, state, changeHandler }) => {
  return (
    <Wrapper items={body && body.length}>
      {body.map((item, index) => (
        <Items selected={state === item} key={index}>
          <h5 key={index} onClick={() => changeHandler(item)}>
            {item}
          </h5>
          <div className="indicator"></div>
        </Items>
      ))}
    </Wrapper>
  );
};

export default HorizontalSelect;
