import React from "react";
import styled from "styled-components";

const Wrapper = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.2s ease-in;
  color: white;

  .radio {
    display: none;
    &:checked + &:after {
      transform: scale(1);
    }
  }

  .radioBG {
    height: 1.5rem;
    width: 1.5rem;
    border: 2px solid #8FE6A4;
    border-radius: 50%;
    margin-right: 10px;
    padding: 2px;

    &:after {
      content: " ";
      height: 100%;
      width: 100%;
      display: block;
      background: #8FE6A4;
      border-radius: 50%;
      transform: scale(0);
    }
  }
  .radio:checked + .radioBG::after {
    transform: scale(1);
  }
`;

const RadioButtons = ({ label, labelID, clickHandler, checked, groupName }) => {
  return (
    <Wrapper htmlFor={labelID}>
      <input
        className="radio"
        type="radio"
        name={groupName}
        id={labelID}
        checked={checked}
        onChange={clickHandler}
        onClick={clickHandler}
      />
      <div className="radioBG" />
      {label}
    </Wrapper>
  );
};

export default RadioButtons;
