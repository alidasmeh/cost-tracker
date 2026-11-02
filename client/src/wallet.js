import { createContext, useContext } from 'react';

// { wallets, current, defaultId, select(id), setDefault(id), reload() } — provided by App once the user's wallets are loaded.
export const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);
