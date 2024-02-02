import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  height: 400px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  padding-top: 50px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  img {
    height: 200px;
    width: 200px;
    border-radius: 50%;
    object-fit: fill;
    margin-right: 25px;
  }

  .text-wrapper {
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    h1 {
      font-family: ClashDisplay-600;
      font-size: 3rem;
      color: #00bb34;
    }
    .details-wrapper {
      display: flex;
      justify-content: space-between;
      .detail {
        h5 {
          font-family: "Poppins";
          font-weight: 400;
          font-size: 16px;
          color: #a8abcb;
        }
        h4 {
          font-family: "Poppins";
          font-weight: 500;
          font-size: 24px;
          color: #00bb34;
        }
      }
      .seperator {
        height: 60px;
        width: 5px;
        border-radius: 25px;
        background-color: #a8abcb;
        opacity: 0.2;
        transform: rotate(20deg);
      }
    }
  }
`;

const Banner = () => {
  return (
    <Wrapper>
      <img src="./images/coolguyzz.png" alt="#" />
      <div className="text-wrapper">
        <h1>01230000</h1>
        <div className="details-wrapper">
          <div className="detail">
            <h5>Listed NFT</h5>
            <h4>152</h4>
          </div>
          <div className="seperator"></div>
          <div className="detail">
            <h5>Total Rentals</h5>
            <h4>1,834</h4>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Banner;
