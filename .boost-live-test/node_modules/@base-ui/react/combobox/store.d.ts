import { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from "../internals/useTransitionStatus.js";
import type { HTMLProps } from "../internals/types.js";
import type { Side } from "../internals/useAnchorPositioning.js";
import type { AriaCombobox } from "./root/AriaCombobox.js";
export type State = {
  id: string | undefined;
  labelId: string | undefined;
  items: readonly any[] | undefined;
  selectedValue: any;
  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;
  forceMounted: boolean;
  inline: boolean;
  activeIndex: number | null;
  selectedIndex: number | null;
  popupProps: HTMLProps;
  listProps: HTMLProps;
  inputProps: HTMLProps;
  triggerProps: HTMLProps;
  itemProps: HTMLProps;
  positionerElement: HTMLElement | null;
  listElement: HTMLElement | null;
  popupId: string | undefined;
  triggerElement: HTMLElement | null;
  inputElement: HTMLInputElement | null;
  inputGroupElement: HTMLDivElement | null;
  popupSide: Side | null;
  openMethod: InteractionType | null;
  inputInsidePopup: boolean;
  inputOwnsFormValue: boolean;
  selectionMode: 'single' | 'multiple' | 'none';
  name: string | undefined;
  form: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  grid: boolean;
  virtualized: boolean;
  openOnInputClick: boolean;
  itemToStringLabel?: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  modal: boolean;
  autoHighlight: false | 'always' | 'input-change';
  submitOnItemClick: boolean;
  hasInputValue: boolean;
};
/**
 * Non-reactive values shared with the combobox parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type ComboboxStoreContext = {
  /** Item elements in list order, owned by `Combobox.List`. */
  readonly listRef: React.RefObject<Array<HTMLElement | null>>;
  /** Item text labels in list order, used for typeahead. */
  readonly labelsRef: React.RefObject<Array<string | null>>;
  /** The popup element. */
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  /** The empty-state element. */
  readonly emptyRef: React.RefObject<HTMLDivElement | null>;
  /** The input element that owns the combobox role. */
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  /** Internal dismiss button rendered before the popup content. */
  readonly startDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Internal dismiss button rendered after the popup content. */
  readonly endDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Whether the last interaction came from the keyboard. */
  readonly keyboardActiveRef: React.RefObject<boolean>;
  /** Container holding the selection chips. */
  readonly chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  /** The clear button. */
  readonly clearRef: React.RefObject<HTMLButtonElement | null>;
  /** Item values in list order. */
  readonly valuesRef: React.RefObject<Array<any>>;
  /** Item element that received the last pointerdown, to pair it with a mouseup. */
  readonly pointerDownItemRef: React.RefObject<Element | null>;
  /** Native event that triggered the in-flight selection. */
  readonly selectionEventRef: React.RefObject<MouseEvent | PointerEvent | KeyboardEvent | null>;
  /** Opens or closes the popup. */
  setOpen: (open: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the input value. */
  setInputValue: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the selected value. */
  setSelectedValue: (value: any, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the active and/or selected index. */
  setIndices: (indices: {
    activeIndex?: number | null | undefined;
    selectedIndex?: number | null | undefined;
    type?: AriaCombobox.HighlightEventReason | undefined;
  }) => void;
  /** Mounts the popup subtree without opening it, to resolve derived item labels. */
  forceMount: () => void;
  /** Applies a selection originating from an item. */
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, itemValue: any) => void;
  /** Requests submission of the owning form. */
  requestSubmit: () => void;
  /** Called when the open state change animation completes. */
  onOpenChangeComplete: (open: boolean) => void;
};
export declare const selectors: {
  id: (state: State) => string | undefined;
  labelId: (state: State) => string | undefined;
  items: (state: State) => readonly any[] | undefined;
  selectedValue: (state: State) => any;
  hasSelectionChips: (state: State) => boolean;
  hasSelectedValue: (state: State) => boolean;
  hasNullItemLabel: (state: State, enabled: boolean) => boolean;
  open: (state: State) => boolean;
  mounted: (state: State) => boolean;
  forceMounted: (state: State) => boolean;
  inline: (state: State) => boolean;
  activeIndex: (state: State) => number | null;
  selectedIndex: (state: State) => number | null;
  isActive: (state: State, index: number) => boolean;
  isSelected: (state: State, itemValue: any) => boolean;
  transitionStatus: (state: State) => TransitionStatus;
  popupProps: (state: State) => HTMLProps;
  listProps: (state: State) => HTMLProps;
  inputProps: (state: State) => HTMLProps;
  triggerProps: (state: State) => HTMLProps;
  itemProps: (state: State) => HTMLProps;
  positionerElement: (state: State) => HTMLElement | null;
  listElement: (state: State) => HTMLElement | null;
  popupId: (state: State) => string | undefined;
  triggerElement: (state: State) => HTMLElement | null;
  inputElement: (state: State) => HTMLInputElement | null;
  inputGroupElement: (state: State) => HTMLDivElement | null;
  popupSide: (state: State) => Side | null;
  openMethod: (state: State) => InteractionType | null;
  inputInsidePopup: (state: State) => boolean;
  inputOwnsFormValue: (state: State) => boolean;
  selectionMode: (state: State) => "multiple" | "none" | "single";
  name: (state: State) => string | undefined;
  form: (state: State) => string | undefined;
  disabled: (state: State) => boolean;
  readOnly: (state: State) => boolean;
  required: (state: State) => boolean;
  grid: (state: State) => boolean;
  virtualized: (state: State) => boolean;
  itemToStringLabel: (state: State) => ((item: any) => string) | undefined;
  isItemEqualToValue: (state: State) => (itemValue: any, selectedValue: any) => boolean;
  modal: (state: State) => boolean;
  autoHighlight: (state: State) => "always" | "input-change" | false;
};
export type ComboboxStore = ReactStore<State, ComboboxStoreContext, typeof selectors>;