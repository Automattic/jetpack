export declare function useLabelableId(params?: UseLabelableIdParameters): string | undefined;
export interface UseLabelableIdParameters {
  /**
   * The control's `id`. Pass `null` for a control that takes its name from `aria-labelledby`
   * instead, so that the label omits `htmlFor`.
   */
  id?: string | null | undefined;
  /**
   * Whether the control owns the label association of its labelable scope.
   * @default true
   */
  enabled?: boolean | undefined;
}
export type UseLabelableIdReturnValue = string;
export interface UseLabelableIdState {}