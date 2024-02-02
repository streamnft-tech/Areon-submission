import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import elipsis from '../../../public/images/Icons.svg';
import supportLogo from "../../../public/images/support_icon.svg";
import sdkLogo from "../../../public/images/sdk_icon.svg"

const Ellipsis = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleOptionClick = (option) => {
    setDropdownOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <Image
            src={elipsis}
            alt="three dots"
          />
        </button>
      </div>

      {dropdownOpen && (
        <div
          className="origin-top-right absolute left-0 right-0  w-44 rounded-md shadow-lg bg-green-6 text-white ring-1 ring-black ring-opacity-5 focus:outline-none z-[999]"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1 " role="none">
            <button
              onClick={() => handleOptionClick('support')}
              className="px-4 py-2 text-sm w-full hover:bg-green-1 hover:text-green-3 text-white flex flex-row gap-1 items-center"
              role="menuitem"
            >
              <Image src={supportLogo} className="h-4 w-4" alt="support" />
              <span>Support/Help</span>
            </button>
            <button
              onClick={() => handleOptionClick('sdk')}
              className="px-4 py-2 text-sm w-full  hover:bg-green-1 text-white hover:text-green-3 flex flex-row gap-1 text-nowrap"
              role="menuitem"
            >
              <Image src={sdkLogo} className="h-4 w-4" alt="sdk" />
              <span className="whitespace-nowrap">SDK Integration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ellipsis;
