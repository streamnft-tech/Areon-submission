import React from "react";
import headerLogo from "../../../public/images/image 13.svg";
import Image from "next/image";

const Header2 = () => {
  const headerStyle = {
    background: "url('/images/announcement copy.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  return (
    <div className="font-numans text-sm text-white flex items-center justify-center py-1 w-[100%]"  style={headerStyle}>
      <span>
        <div className="bg-green-5 h-6 w-6 mx-2 rounded-sm">
          <Image src={headerLogo} alt="headerLogo" />
        </div>
      </span>
      <h3>Renting and loaning made simpler with the new update</h3>
    </div>
  );
};

export default Header2;
