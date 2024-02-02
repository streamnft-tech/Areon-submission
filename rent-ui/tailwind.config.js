/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customBlue: "#202352",
        green: "#00bb34",
        seagreen: "#8FE6A4",
        modalBg: "#000f00",
        grey: "#8d8d8d",
        "grey-1": "#EFEFEF",
        "grey-2": "#4A4A4A",
        white: "#fff",
        "seperator-bg": "#2c2c2c",
        greenBlurred: "rgba(0, 187, 52, 0.3)",
        seperator: "rgba(255,255,255,0.1)",
        blackBlurred: "rgba(0,0,0,0.4)",
        black: "#000",
        gray33: "#545454",
        gray1: "#292929",
        "dark-gray": "#212121",
        "nav-buttons": "#3b3b3b",
        "bluish-grey": "#a8abcb",
        "black-2": "#1d1d1d",
        "sky-blue": "#5A85F5",
        "blue-3": "#4b5dff",
        "remDays-block": "#F06B41",
        "seperator-2": "#30365C",
        "black-3": "#181818",
        "black-4": "#1F1F1FC9",
        "black-5": "#353535A6",
        transparent: "transparent",
        "custom-yellow": "#D99832",
        "gray-30": "#303030",
        "green-1": "#dff9e5",
        "green-2": "#1A4D27",
        "green-3": "#0A7128",
        "green-4": "#30B750",
        "green-5": "#8FE6A4",
        "green-6": "#30B750",
      },
      height: {
        max: "calc(100vh - 205px)",
      },
      maxWidth: {
        1200: "1200px",
      },
      minWidth: {
        "1/3": "33.33%",
        1200: "1200px",
      },
      fontFamily: {
        numans: "Numans",
        poppins: "Poppins",
        clashDisplay: "Clash Display",
      },
    },
  },
  plugins: [],
};
