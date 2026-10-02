interface OTPValidationConfig {
  slotPattern: string;
  getRootPattern: (length: number) => string;
  regexp: RegExp;
  inputMode: 'numeric' | 'text';
}
export type OTPValidationType = 'numeric' | 'alpha' | 'alphanumeric' | 'none';
export declare function getOTPValidationConfig(validationType: OTPValidationType): OTPValidationConfig | null;
export declare function stripOTPWhitespace(value: string | null | undefined): string;
/**
 * Normalizes user-entered OTP text by stripping whitespace, applying validation and custom
 * normalization, and clamping the final value to the configured slot count.
 */
export declare function normalizeOTPValueWithDetails(value: string | null | undefined, length: number, validationType: OTPValidationType, normalizeValue?: ((value: string) => string) | undefined): readonly [value: string, didRejectCharacters: boolean];
export declare function normalizeOTPValue(value: string | null | undefined, length: number, validationType: OTPValidationType, normalizeValue?: ((value: string) => string) | undefined): string;
/**
 * Replaces characters starting at the provided slot index, then re-normalizes the final OTP value
 * so paste and multi-character edits stay contiguous and length-bounded.
 */
export declare function replaceOTPValue(currentValue: string, index: number, nextValue: string, length: number, validationType: OTPValidationType, normalizeValue?: ((value: string) => string) | undefined): string;
export declare function removeOTPCharacter(currentValue: string, index: number): string;
export {};