import * as React from 'react';
import { HTMLProps } from "../types.js";
export interface LabelableContext {
  /**
   * The `id` of the labelable element.
   * When `null` the label omits `htmlFor`, either because the association is implicit or
   * because the control takes its name from `aria-labelledby`.
   */
  controlId: string | null | undefined;
  registerControlId: (source: symbol, id: string | null | undefined) => void;
  resetControlId: () => void;
  /**
   * The `id` of the label.
   */
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * An array of `id`s of elements that provide an accessible description.
   */
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  getDescriptionProps: (externalProps: HTMLProps) => HTMLProps;
}
/**
 * A context for providing [labelable elements](https://html.spec.whatwg.org/multipage/forms.html#category-label)\
 * with an accessible name (label) and description.
 */
export declare const LabelableContext: React.Context<LabelableContext>;
export declare function useLabelableContext(): LabelableContext;