import styled from "styled-components";

export const Wrapper = styled.div`
  height: fit-content;
  width: 100%;
  min-height: calc(100vh - 10rem);
  

  @media screen and (max-width: 1280px) {
    padding: 0 5%;
  }

  .cards-wrapper {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2rem;
    margin-top: 100px;
  }

  .featured-profiles-wrapper {
    margin: 100px 0;
    h1 {
      font-family: ClashDisplay-600;
      font-style: normal;
      font-size: 42px;
      line-height: 52px;
      color: #fff;
      span {
        color: #00bb34;
      }
    }
    h5 {
      font-family: "Poppins";
      font-style: normal;
      font-weight: 400;
      font-size: 20px;
      line-height: 30px;
      /* identical to box height */

      color: #878787;
    }
  }
`;
