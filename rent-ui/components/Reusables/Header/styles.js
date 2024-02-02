import styled from "styled-components";

export const Wrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 15px;

  @media screen and (max-width: 1280px) {
    padding: 0 5%;
  }

  .header {
    height: 5rem;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left {
    height: 100%;
    min-width: 33.33%;
    cursor: pointer;
    display: flex;
    align-items: center;
    column-gap: 1rem;

    .logo-image {
      width: 150%;
      height: 100%;
      margin-left: -20%;
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
  .header-center {
    height: 100%;
    width: fit-content;
    min-width: 33.33%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .header-right {
    height: 100%;
    min-width: 33.33%;
    display: flex;
    column-gap: 1rem;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
  }
  .reward-value {
    font-family: ClashDisplay-700;
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 23px;
    color: #00bb34;
  }
  .manage-link {
    font-family: "Poppins";
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 21px;
    letter-spacing: 0.25px;
    cursor: pointer;
  }
  .mint-nft {
    font-family: "Poppins";
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 21px;
    letter-spacing: 0.25px;
    margin-right: 1rem;
    cursor: pointer;
  }
  .navbar-item {
    font-family: "Poppins", sans-serif;
    font-style: normal;
    font-weight: 400;
    font-size: 0.9rem;
    line-height: 1.5rem;
    cursor: pointer;
    /* width: 120px; */
    text-align: center;
    /* identical to box height */

    display: flex;
    align-items: center;
    letter-spacing: 0.25px;

    color: #ffffff;

    /* Inside auto layout */

    flex: none;
    order: 0;
    flex-grow: 0;
  }
  .vertical-line {
    height: 36px;
    width: 1px;
    border-left: solid 1px white;
  }
  .green-button {
    background: #00bb34;
    padding: 11px 2vw;
    position: relative;
  }
  .button-text {
    font-family: "Poppins", sans-serif;
    font-style: normal;
    font-weight: 600;
    font-size: 1.2vw;
    line-height: 1.8vw;
    /* identical to box height */

    text-align: center;
    text-transform: uppercase;

    color: #ffffff;
  }
  .green-button-outline {
    position: absolute;
    width: 11vw;
    height: 42px;
    border: solid 2px #00bb34;
    top: 25%;
    right: -0.6vw;
  }

  .nav-open-button {
    height: fit-content;
    width: fit-content;
    display: none;

    > div {
      height: 2px;
      width: 30px;
      margin-bottom: 5px;
      background: #00bb34;
      transform-origin: 5px;
      transition: all 0.2s ease-in;

      &:nth-child(1) {
        transform: ${(props) =>
          props.open ? "rotate(45deg)" : "rotate(0deg)"};
      }
      &:nth-child(2) {
        opacity: ${(props) => (props.open ? "0" : "1")};
      }
      &:nth-child(3) {
        transform: ${(props) =>
          props.open ? "rotate(-45deg)" : "rotate(0deg)"};
      }
    }
  }

  .bottom-bar {
    height: fit-content;
    max-height: ${(props) => (props.open ? "300px" : "0")};
    width: 100%;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    transition: all 0.2s ease-in;
    background: #00bb34;
    border-radius: 5px;
    transform-origin: top;
    padding: ${(props) => (props.open ? "25px " : "0 25px")};
    display: none;

    h5 {
      font-family: "Poppins", sans-serif;
      font-size: 1rem;
      font-weight: 400;
      margin: 0.5rem 0;
      cursor: pointer;
    }

    hr {
      margin: 1rem 0;
      height: 2px;
      border: none;
      background: #000;
    }
  }

  @media screen and (max-width: 968px) {
    .header-right {
      display: none;
    }
    .nav-open-button {
      display: block;
    }
    .bottom-bar {
      display: block;
    }
  }
`;
