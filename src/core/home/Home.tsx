import "./_home.scss";

import {Button, useToaster} from "@hipo/react-ui-toolkit";
import {useEffect, useState} from "react";
import {PeraWalletConnect} from "@perawallet/connect";

import AccountBalance from "./account-balance/AccountBalance";
import Game from "../game/Game";
import PeraToast from "../component/toast/PeraToast";
import {ChainType} from "../utils/algod/algod";
import useGetAccountDetailRequest from "../hooks/useGetAccountDetailRequest/useGetAccountDetailRequest";
import {PERA_WALLET_LOCAL_STORAGE_KEYS} from "../utils/storage/pera-wallet/peraWalletTypes";
import peraApiManager from "../utils/pera/api/peraApiManager";

const isCompactMode = localStorage.getItem(PERA_WALLET_LOCAL_STORAGE_KEYS.COMPACT_MODE);
let peraWallet = new PeraWalletConnect({compactMode: isCompactMode === "true"});

function Home() {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const isConnectedToPeraWallet = !!accountAddress;
  const {display: displayToast} = useToaster();
  const {accountInformationState} = useGetAccountDetailRequest({
    chain: ChainType.MainNet,
    accountAddress: accountAddress || ""
  });

  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts && accounts[0]) {
          setAccountAddress(accounts[0]);
          handleSetLog("Connected to Pera Wallet");
        }

        peraWallet.connector?.on("disconnect", () => {
          setAccountAddress(null);
        });
      })
      .catch((e) => console.log(e));

    // Set API to MainNet
    peraApiManager.updateFetcher(ChainType.MainNet);
  }, []);

  return (
    <div className={`app ${isConnectedToPeraWallet ? "app--connected" : ""}`}>
      <div className={"app__header"}>
        {!isConnectedToPeraWallet ? (
          <Button
            customClassName={"app__button--connect"}
            onClick={handleConnectWalletClick}>
            Connect to Pera Wallet
          </Button>
        ) : (
          <Button
            customClassName={"app__button--disconnect"}
            onClick={handleDisconnectWalletClick}>
            Disconnect
          </Button>
        )}
      </div>

      <div className="app__content">
        {accountInformationState.data && (
          <AccountBalance
            accountInformation={accountInformationState.data}
            chain={ChainType.MainNet}
          />
        )}

        {isConnectedToPeraWallet && (
          <Game 
            accountAddress={accountAddress}
            peraWallet={peraWallet}
            chain={ChainType.MainNet}
            handleSetLog={handleSetLog}
          />
        )}
      </div>
    </div>
  );

  async function handleConnectWalletClick() {
    try {
      const newAccounts = await peraWallet.connect();
      handleSetLog("Connected to Pera Wallet");
      setAccountAddress(newAccounts[0]);
    } catch (e) {
      console.log(e);
      handleSetLog(`${e}`);
    }
  }

  function handleDisconnectWalletClick() {
    peraWallet.disconnect();
    setAccountAddress(null);
  }

  function handleSetLog(log: string) {
    displayToast({
      timeout: 10000,
      render() {
        return <PeraToast message={log} />;
      }
    });
  }
}

export default Home;
