import React, { useEffect,useContext } from "react";
import { useRouter } from "next/router";

const index = () => {

  const router = useRouter();
  useEffect(() => {
    const selectedChain = localStorage.getItem("selectedChain");
    // const selectedChain=chainId;
    if (selectedChain) {
      router.push(`/${selectedChain}`);
    } else {
      router.push("/hedera");
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (url === "/") {
        const selectedChain = localStorage.getItem("selectedChain");
        // const selectedChain=chainId;
        
        if (selectedChain) {
          router.push(`/${selectedChain}`);
        } else {
          router.push("/hedera");
        }
      }
    };

    router.events.on( handleRouteChange);

    return () => {
      router.events.off( handleRouteChange);
    };
  }, [router.query.chain]);
  return <div>index</div>;
};

export default index;
