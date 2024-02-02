import styled from "styled-components";

const sizes = {
  tablet: '768px',
  laptop: '1024px',
  laptopL: '1440px',
  desktop: '2560px',
}

const devices = {
  tablet: `(min-width: ${sizes.tablet})`,
  laptop: `(min-width: ${sizes.laptop})`,
  laptopL: `(min-width: ${sizes.laptopL})`,
  desktop: `(min-width: ${sizes.desktop})`,
}


export const Wrapper = styled.div`
  //overflow-y: scroll;
  height: fit-content;
  width: 100%;
  max-width: 90%;
  margin: 1rem auto 3rem auto;
  display: flex;
  justify-content: start;
  flex-wrap: wrap;
  column-gap: 16px;
  row-gap: 16px;
  background: #0B0B0B;
  padding: 16px;
  border-radius: 16px;

  @media ${devices.tablet} {
    margin-bottom: 16rem;
  }

  @media ${devices.laptop} {
    margin-bottom: 8rem;
  }

  @media ${devices.laptopL} {
    margin-bottom: 6rem;
  }

  @media ${devices.desktop} {
    margin-bottom: 4rem;
  }

  h1 {
    text-align: center;
    color: #fff;
    justify-self: center;
    font-family: ClashDisplay-700;
  }

  .h-14{
    height: 14vh;
  }
`;
