import * as React from 'react';
export interface CSPContextValue {
  nonce?: string | undefined;
  disableStyleElements?: boolean | undefined;
}
export declare const CSPContext: React.Context<CSPContextValue | undefined>;
export declare function useCSPContext(): CSPContextValue;