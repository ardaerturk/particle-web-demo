/**
 * intersendWagmiWallet.ts
 */

import { initializeConnector } from '@web3-react/core';
import { Connector, type Actions, type ProviderRpcError } from '@web3-react/types';
import { IntersendSdkClient } from './IntersendSdkClient';


interface IntersendAuthConstructorArgs {
  actions: Actions;
  onError?: (error: Error) => void;
}

/**
 * The IntersendAuth class extends `@web3-react/types` Connector.
 */
export class IntersendAuth extends Connector {
  public provider: any;
  private eagerConnection?: Promise<void>;

  constructor({ actions, onError }: IntersendAuthConstructorArgs) {
    super(actions, onError);
  }

  /** Fires when the wallet or provider signals a disconnect */
  private onDisconnect = (error?: ProviderRpcError): void => {
    this.actions.resetState();
    if (error) this.onError?.(error);
  };

  /** Fires when the chain is switched in the parent wallet */
  private onChainChanged = (chainId: number | string): void => {
    this.actions.update({ chainId: Number(chainId) });
  };

  /** Fires when the user’s accounts change */
  private onAccountsChanged = (accounts: string[]): void => {
    if (accounts.length === 0) {
      this.actions.resetState();
    } else {
      this.actions.update({ accounts });
    }
  };

  /**
   * Register event listeners on the injected provider
   * so we can detect account/chain changes and disconnections.
   */
  private setupEventListeners(): void {
    const provider = IntersendSdkClient.getProvider();
    if (provider) {
      provider.on?.('disconnect', this.onDisconnect);
      provider.on?.('chainChanged', this.onChainChanged);
      provider.on?.('accountsChanged', this.onAccountsChanged);
    }
  }

  /**
   * Remove any listeners if needed during cleanup.
   */
  private removeEventListeners(): void {
    const provider = IntersendSdkClient.getProvider();
    if (provider) {
      provider.off?.('disconnect', this.onDisconnect);
      provider.off?.('chainChanged', this.onChainChanged);
      provider.off?.('accountsChanged', this.onAccountsChanged);
    }
  }

  /**
   * Lazy-load logic for SSR or to avoid multiple initializations.
   * Example: Calls `IntersendSdkClient.init()` once.
   */
  private async isomorphicInitialize() {
    if (this.eagerConnection) return;
    if (typeof window !== 'undefined') {
      this.eagerConnection = (async () => {
        await IntersendSdkClient.init();
        this.provider = IntersendSdkClient.getProvider();
        this.setupEventListeners();
      })();
    }
  }

  private get connected(): boolean {
    // For instance, if Intersend stores an address in memory after init
    return Boolean(IntersendSdkClient.getAddress());
  }

  /**
   * Called by wagmi when explicitly connecting via UI or programmatic connect.
   */
  async activate(): Promise<void> {
    const cancelActivation = this.actions.startActivation();

    try {
      await this.isomorphicInitialize();

      const address = IntersendSdkClient.getAddress();
      if (!address) throw new Error('No address from Intersend');

      // If Intersend doesn’t provide chainId, default to 1 (Ethereum)
      const chainId = 1; 
      this.actions.update({ chainId, accounts: [address] });
    } catch (error) {
      cancelActivation();
      throw error;
    }
  }

  /**
   * Called automatically by wagmi on page load if eager connection is enabled.
   */
  async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation();

    try {
      await this.isomorphicInitialize();

      if (!this.provider || !this.connected) {
        throw new Error('No existing Intersend connection');
      }

      const address = IntersendSdkClient.getAddress();
      if (!address) throw new Error('No address from Intersend');

      // If you have chain detection, use it here:
      const chainId = 1; 
      this.actions.update({ chainId, accounts: [address] });
    } catch (error) {
      cancelActivation();
      throw error;
    }
  }

  /**
   * Called when the user or app requests a disconnect.
   */
  async deactivate(): Promise<void> {
    this.removeEventListeners();
    this.actions.resetState();
  }
}


export const [intersendAuth, hooks] = initializeConnector<IntersendAuth>(
    (actions) =>
        new IntersendAuth({
            actions: config?.chains?.actions || config.actions,
            onError: config.onError, 

    })
);
    