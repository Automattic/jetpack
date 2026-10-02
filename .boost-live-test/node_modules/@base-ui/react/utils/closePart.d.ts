import * as React from 'react';
interface ClosePartContextValue {
  register: () => () => void;
}
export declare const ClosePartContext: React.Context<ClosePartContextValue | undefined>;
export declare function useClosePartCount(): {
  context: {
    register: () => () => void;
  };
  hasClosePart: boolean;
};
export declare function useClosePartRegistration(): void;
export {};