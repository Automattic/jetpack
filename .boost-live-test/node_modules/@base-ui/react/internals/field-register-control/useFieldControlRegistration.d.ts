import * as React from 'react';
import type { FieldValidityData } from "../../field/root/FieldRoot.js";
export interface FieldControlRegistration {
  controlRef: React.RefObject<any>;
  id: string | undefined;
  name?: string | undefined;
  getValue?: (() => unknown) | undefined;
  value: unknown;
}
export declare function useFieldControlRegistration(params: UseFieldControlRegistrationParameters): readonly [() => void, (source: symbol, registration: FieldControlRegistration | undefined) => void];
export interface UseFieldControlRegistrationParameters {
  change: (value: unknown, cancelPending?: boolean) => void;
  commit: (value: unknown) => void;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  name: string | undefined;
  setRegisteredFieldName: (name: string | undefined) => void;
  registeredFieldIdRef: React.RefObject<string | undefined>;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  validityData: FieldValidityData;
}