import { type AppType } from "next/app";

import NoSSR from "react-no-ssr";
import { api } from "~/utils/api";

import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <NoSSR>
      <Component {...pageProps} />
    </NoSSR>
  );
};

export default api.withTRPC(MyApp);
