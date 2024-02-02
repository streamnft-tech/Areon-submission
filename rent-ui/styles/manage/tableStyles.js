import styled from "styled-components";

export const Wrapper = styled.div`
  height: fit-content;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: white;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #19fb9b;
  margin-bottom: 100px;

  .nft-image {
    height: 2.5rem;
    width: 2.5rem;
    object-fit: cover;
    border-radius: 50%;
    margin-right: 10px;
  }

  .nft-name-section {
    display: flex;
    align-items: center;
    height: 100%;
    width: fit-content;
  }

  .table-header,
  .table-row {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .table-row {
    color: #878787;
  }
  .table-elements {
    min-width: 11.11%;
  }
  .NFT {
    min-width: 150px !important;
  }
  .complete {
    color: #19fb9b;
  }
`;
