import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mixpanel } from '../../../util/mixpanel';

const HeaderNavigation = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('My Assets');

  const handleButtonClick = (item) => {
    if (item === 'My Assets') {
      router.push(`/${router.query.chain}/${router.query.symbol}/myassets`);
      Mixpanel.track('home_rentmkt_collection_lend');
    } else if (item === 'Marketplace') {
      router.push(`/${router.query.chain}/${router.query.symbol}/marketplace`);
      Mixpanel.track('home_rentmkt_collection_rent');
    } else {
      router.push(`/${router.query.chain}/${router.query.symbol}/rentals`);
      Mixpanel.track('home_rentmkt_collection_rent');
    }
  };

  useEffect(() => {
    setSelectedOption(
      router.pathname.includes("myassets")
        ? "My Assets"
        : router.pathname.includes("rentals")
        ? "My Rentals"
        : "Marketplace"
    );
  }, [router.pathname]);

  return (
    <div className='font-numans text-xs w-full bg-green-3 py-2 sticky top-24 z-[999]'>
      <div className='flex flex-row items-center justify-center gap-16'>
        <button
          className={`flex items-center justify-center mx-2 focus:outline-none ${
            selectedOption === "My Assets" ? 'text-white' : 'text-seagreen'
          }`}
          onClick={() => handleButtonClick("My Assets")}
        >
          <div className='relative'>My Assets</div>
        </button>
        <button
          className={`flex items-center justify-center mx-2 focus:outline-none ${
            selectedOption === "Marketplace" ? 'text-white' : 'text-seagreen'
          }`}
          onClick={() => handleButtonClick("Marketplace")}
        >
          <div className='relative'>Marketplace</div>
        </button>
        <button
          className={`flex items-center justify-center mx-2 focus:outline-none ${
            selectedOption === "My Rentals" ? 'text-white' : 'text-seagreen'
          }`}
          onClick={() => handleButtonClick("My Rentals")}
        >
          <div className='relative'>My Rentals</div>
        </button>
      </div>
    </div>
  );
};

export default HeaderNavigation;
