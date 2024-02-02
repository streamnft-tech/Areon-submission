import React, { createContext, useState } from 'react';

export const HederaContext = createContext();

export const HederaContextWrapper = ({ children }) => {
  const [isPaired, setIsPaired] = useState(false);
  return (
    <HederaContext.Provider
      value={{
        isPaired,
        setIsPaired,
      }}
    >
      {children}
    </HederaContext.Provider>
  );
};
