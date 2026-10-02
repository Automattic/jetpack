import { ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { TransitionStatus } from "../internals/useTransitionStatus.js";
import type { HTMLProps } from "../internals/types.js";
import type { Side } from "../internals/useAnchorPositioning.js";
import { type Group } from "../internals/resolveValueLabel.js";
import type { SelectRoot } from "./root/SelectRoot.js";
export type State = {
  id: string | undefined;
  labelId: string | undefined;
  modal: boolean;
  multiple: boolean;
  items: Record<string, React.ReactNode> | ReadonlyArray<{
    label: React.ReactNode;
    value: any;
  }> | ReadonlyArray<Group<any>> | undefined;
  itemToStringLabel: ((item: any) => string) | undefined;
  itemToStringValue: ((item: any) => string) | undefined;
  isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  value: any;
  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;
  activeIndex: number | null;
  selectedIndex: number | null;
  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  listElement: HTMLDivElement | null;
  popupSide: Side | null;
  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;
  hasScrollArrows: boolean;
};
/**
 * Non-reactive values shared with the select parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type SelectStoreContext = {
  readonly listRef: React.RefObject<Array<HTMLElement | null>>;
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  readonly scrollHandlerRef: React.RefObject<((element: HTMLDivElement) => void) | null>;
  readonly scrollArrowsMountedCountRef: React.RefObject<number>;
  readonly valueRef: React.RefObject<HTMLSpanElement | null>;
  readonly valuesRef: React.RefObject<Array<any>>;
  readonly labelsRef: React.RefObject<Array<string | null>>;
  readonly typingRef: React.RefObject<boolean>;
  readonly selectionRef: React.RefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    dragY: number;
  }>;
  readonly firstItemTextRef: React.RefObject<HTMLElement | null>;
  readonly selectedItemTextRef: React.RefObject<HTMLElement | null>;
  readonly alignItemWithTriggerActiveRef: React.RefObject<boolean>;
  readonly initialValueRef: React.RefObject<any>;
  setValue: (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => void;
  setOpen: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
  handleScrollArrowVisibility: (scroller: HTMLElement) => void;
  onOpenChangeComplete: (open: boolean) => void;
};
export declare const selectors: {
  id: (state: State) => string | undefined;
  labelId: (state: State) => string | undefined;
  modal: (state: State) => boolean;
  items: (state: State) => readonly Group<any>[] | readonly {
    label: React.ReactNode;
    value: any;
  }[] | Record<string, import("react").ReactNode> | undefined;
  itemToStringLabel: (state: State) => ((item: any) => string) | undefined;
  isItemEqualToValue: (state: State) => (itemValue: any, selectedValue: any) => boolean;
  value: (state: State) => any;
  hasSelectedValue: (state: State) => boolean;
  hasNullItemLabel: (state: State, enabled: boolean) => boolean;
  open: (state: State) => boolean;
  mounted: (state: State) => boolean;
  forceMount: (state: State) => boolean;
  transitionStatus: (state: State) => TransitionStatus;
  openMethod: (state: State) => InteractionType | null;
  activeIndex: (state: State) => number | null;
  selectedIndex: (state: State) => number | null;
  isActive: (state: State, index: number) => boolean;
  isSelected: (state: State, itemValue: any) => boolean;
  isSelectedByFocus: (state: State, index: number) => boolean;
  popupProps: (state: State) => HTMLProps;
  triggerProps: (state: State) => HTMLProps;
  triggerElement: (state: State) => HTMLElement | null;
  positionerElement: (state: State) => HTMLElement | null;
  listElement: (state: State) => HTMLDivElement | null;
  popupSide: (state: State) => Side | null;
  scrollUpArrowVisible: (state: State) => boolean;
  scrollDownArrowVisible: (state: State) => boolean;
  hasScrollArrows: (state: State) => boolean;
};
export type SelectStore = ReactStore<State, SelectStoreContext, typeof selectors>;