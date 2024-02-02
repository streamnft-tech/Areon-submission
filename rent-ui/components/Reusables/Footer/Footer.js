import React from "react";
import { Wrapper } from "./styles";
import footerIcon from "../../../public/images/footerlogo.png";
import discordIcon from "../../../public/images/discord.svg";
import twitterIcon from "../../../public/images/twitter.svg";
import Image from "next/image";

const Footer = () => {
  return (
    <Wrapper>
      <div className="footer-inner-wrapper">
        <div className="logo">
          <Image src={footerIcon} alt="logo" />
          <h5>StreamNFT</h5>
        </div>
        <h5>&#169; 2022 StreamNFT. All Rights Reserved.</h5>
        <div className="icons-wrapper">
          <div className="icon-wrapper">
            <Image src={twitterIcon} alt="twitter" />
          </div>
          <div className="icon-wrapper">
            <Image src={discordIcon} alt="discord" />
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Footer;
