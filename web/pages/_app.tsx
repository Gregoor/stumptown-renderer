import { GAProvider } from "../src/ga-context";
import { UserDataProvider } from "../src/user-context";

import "../src/app.scss";

export default function App({ Component, pageProps }) {
  return (
    <GAProvider>
      <UserDataProvider>
        <Component {...pageProps} />
      </UserDataProvider>
    </GAProvider>
  );
}
