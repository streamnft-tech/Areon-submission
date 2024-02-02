import Head from "next/head";
import { Fragment } from "react";
import "../styles/globals.css";
import "../styles/fonts.css";
import ModalContextWrapper from "../context/ModalContext";
import ManageNavWrapper from "../context/ManageNavContext";
import { useMemo } from "react";
import { HederaContextWrapper } from "../context/HederaContext";
//import { ThirdwebProvider } from "@thirdweb-dev/react/solana";
import "@rainbow-me/rainbowkit/styles.css";

/* For wallets */
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import Toast from "../components/Reusables/Toast/Toast";
import Script from "next/script";
import ScrollHeader from "../components/Reusables/ScrollHeader/ScrollHeader";
import Header from "../components/Reusables/Header/Header";

import ScrollHeaderContextWrapper from "../context/ScrollHeaderContext";
import { OKXWalletAdapter } from "./../util/OKXWalletAdapter";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { sepolia,telosTestnet } from "viem/chains";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { publicProvider } from "wagmi/providers/public";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import SepoliaContextWrapper from "../context/SepoliaContext";
import Footer from "../components/Reusables/Footer/Footer";
require("@solana/wallet-adapter-react-ui/styles.css");

const { chains, publicClient } = configureChains([telosTestnet], [publicProvider()]);

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains: chains }),
      // metaMaskWallet({ chains: chains }),
    ],
  },
]);
const wagmiConfig = createConfig({
  connectors,
  publicClient,
});

function MyApp({ Component, pageProps }) {
  const solNetwork = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(solNetwork), [solNetwork]);

  // initialise all the wallets you want to use
  const wallets = useMemo(
    () => [
      new OKXWalletAdapter(),
      new PhantomWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [solNetwork]
  );


  return (
    <Fragment>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-RDF1CNS5YC"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
         
           gtag('config', 'G-RDF1CNS5YC');
        `}
      </Script>
      <Head>
        <title>StreamNFT | NFT Finance and Ownership protocol</title>
        <meta
          name="description"
          content="StreamNFT protocol is a utility layer for non-fungible tokens that unlock conditional ownership and liquidity of NFTs with rentals, loans, and token-gated access. "
        />
        <link rel="icon" href="/favicon.ico" />
        <Script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
                    (function () {
                      window.Saber = {
                        apiKey: "ee8a0c9dd8e5d4390103",
                        com: [], do: function () { this.com.push(arguments) }
                      };
                      var e = document.createElement("script");
                      e.setAttribute("type", "text/javascript");
                      e.setAttribute("src", "https://widget.saberfeedback.com/v2/widget.js");
                      document.getElementsByTagName("head")[0].appendChild(e);
                
                
                    })();`,
          }}
        />
      </Head>
      <div className="background">
        <div className="color-bg">
          <ModalContextWrapper>
            <ManageNavWrapper>
              <ScrollHeaderContextWrapper>
                <ConnectionProvider endpoint={endpoint}>
                  <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                      <WagmiConfig config={wagmiConfig}>
                        <RainbowKitProvider
                          chains={chains}
                          modalSize="compact"
                          theme={darkTheme({
                            accentColor: "#00bb34",
                            accentColorForeground: "black",
                            borderRadius: "small",
                            fontStack: "system",
                            overlayBlur: "small",
                          })}
                        >
                          <HederaContextWrapper>
                            <Header />
                            <SepoliaContextWrapper>
                              <ScrollHeader />
                              <Component {...pageProps} />
                              <Toast />
                              <Footer/>
                            </SepoliaContextWrapper>
                          </HederaContextWrapper>
                        </RainbowKitProvider>
                      </WagmiConfig>
                    </WalletModalProvider>
                  </WalletProvider>
                </ConnectionProvider>
              </ScrollHeaderContextWrapper>
            </ManageNavWrapper>
          </ModalContextWrapper>
        </div>
      </div>
    </Fragment>
  );
}

export default MyApp;
