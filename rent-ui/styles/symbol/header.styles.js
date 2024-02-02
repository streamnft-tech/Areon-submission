import styled from "styled-components";

export const Wrapper = styled.div`
  .inner-wrapper {
    color: #fff;
    justify-content: start;
    align-items: center;
    margin: 1rem auto 10px auto;
    width: 100%;
    max-width: 100vw;
    height: 136px;
    display: flex;
    gap: 1.5rem;
    padding:0 3.5rem;

    .w-200{
      width: 200px;
    } 

    img {
      height: 136px;
      width: 200px;
      object-fit: cover;
      object-position: center;
      align-items: center;
      border-radius: 10px;
      padding-bottom: 3px;
      max-width: 200px;
    }

    .header-contents {
      display: flex;
      flex-direction: column;
      justify-content: center;

      .title-line-with-icons {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      h1 {
        font-family: Numans;
        font-size: 20px;
        color: #f1fcf3;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
      }

      p {
        font-family: Numans;
        font-weight: 400;
        font-size: 12px;
        line-height: 20px;
        font-style: normal;
        color: var(--Grayscale-500, #7c7c7c);
        /* color: #7C7C7C; */
        text-align: justify;
      }

      .icons-wrapper {
        height: 24px;
        width: fit-content;
        display: flex;
        margin: 0 1rem;

        .icon-wrapper {
          height: 24px;
          width: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #292929;
          border-radius: 50%;
          border: 0.6px solid #092a13;
          margin-right: 1rem;
          cursor: pointer;

          &:hover {
            background: #30b750;
            transform: scale(1.1, 1.1);
          }

          img {
            height: 12px;
            width: 14px;
            object-fit: fill;
          }
        }
      }

      .details-wrapper {
        height: 70px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: start;
        column-gap: 1.4rem;

        .detail {
          width: fit-content;
          padding-right: 1rem;

          h5 {
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            color: #ffffff;
            line-height: normal
            color: var(--Grayscale-50, #FFF);

          }

          h4 {
            color: var(--Green-2-500, #30B750);;
            white-space: nowrap;
            font-size: 20px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
          }
        }

        .seperator {
          height: 35px;
          width: 2px;
          background: #a8abcb;
          opacity: 0.2;
          transform: rotate(15deg);
        }
      }
    }
  }
`;
