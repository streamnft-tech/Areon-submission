import React from "react";
import styled from "styled-components";
import { useRouter } from "next/router";

const Wrapper = styled.div`
  height: 80vh;
  width: 99vw;
  display: flex;
  justify-content: center;
  align-items: center;

  .background {
    height: 100%;
    width: 100%;
  }
  .color-bg {
    height: 100%;
    width: 100%;
    background-color: rgb(0, 0, 0, 0.93);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  h1 {
    font-family: ClashDisplay-700;
    font-style: normal;
    font-size: 3rem;
    color: #fff;
    margin-top: 50px;
  }

  img {
    height: 25%;
    width: 25%;
    object-fit: contain;
  }
  .header-left {
    width: fit-content;
    cursor: pointer;
    display: flex;
    align-items: center;
    column-gap: 1rem;

    .logo-image {
      margin-top: -7%;
      object-fit: cover;
    }
    h5 {
      font-family: ClashDisplay-400;
      font-size: 2rem;
      color: #fff;
      span {
        font-family: ClashDisplay-700;
        color: #00bb34;
      }
    }
  }
`;

export default function Custom404() {
  const router = useRouter();

  return (
    <Wrapper>
      <div>
        <div className="background">
          <div className="color-bg">
            <img src="/images/notfound.png" alt="" />
            <h1>404, Page Not Found !! </h1>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
