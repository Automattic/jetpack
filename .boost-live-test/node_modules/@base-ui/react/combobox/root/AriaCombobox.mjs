'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { getOverflowAncestors, useDismiss, useFloatingRootContext, useListNavigation, useClick } from "../../floating-ui-react/index.mjs";
import { gridNavigation } from "../../floating-ui-react/hooks/gridNavigation.mjs";
import { contains, getTarget } from "../../floating-ui-react/utils.mjs";
import { createChangeEventDetails, createGenericEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { ComboboxFloatingContext, ComboboxDerivedItemsContext, ComboboxHasItemsContext, ComboboxRootContext, ComboboxInputValueContext } from "./ComboboxRootContext.mjs";
import { selectors } from "../store.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { useRegisterFieldControl } from "../../internals/field-register-control/useRegisterFieldControl.mjs";
import { useFormContext } from "../../internals/form-context/FormContext.mjs";
import { useLabelableId } from "../../internals/labelable-provider/useLabelableId.mjs";
import { createCollatorItemFilter } from "./utils/index.mjs";
import { useCoreFilter } from "./utils/useFilter.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { useOpenInteractionType } from "../../utils/useOpenInteractionType.mjs";
import { isScrollableY } from "../../utils/scrollable.mjs";
import { useValueChanged } from "../../internals/useValueChanged.mjs";
import { NOOP } from "../../internals/noop.mjs";
import { FOCUSABLE_POPUP_PROPS } from "../../utils/popups/index.mjs";
import { mergeProps } from "../../merge-props/index.mjs";
import { stringifyAsLabel, stringifyAsValue, flattenLeafItems, isGroupedItems } from "../../internals/resolveValueLabel.mjs";
import { compareItemEquality, defaultItemEquality, findItemIndex, findSelectionIndex, isSelectedValueDirty, removeItem, selectedValueIncludes } from "../../internals/itemEquality.mjs";
import { INITIAL_LAST_HIGHLIGHT, NO_ACTIVE_VALUE } from "./utils/constants.mjs";
import { useDirection } from "../../internals/direction-context/DirectionContext.mjs";
import { findCollectionItem } from "../items/itemCollection.mjs";

/**
 * @internal
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AriaCombobox(props) {
  const {
    id: idProp,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    defaultSelectedValue = null,
    selectedValue: selectedValueProp,
    onSelectedValueChange,
    defaultInputValue,
    inputValue: inputValueProp,
    open: openProp,
    defaultOpen = false,
    selectionMode,
    onItemHighlighted: onItemHighlightedProp,
    name: nameProp,
    form,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    inputRef: inputRefProp,
    grid = false,
    items: itemsProp,
    filteredItems: filteredItemsProp,
    filter: filterProp,
    filterQuery: filterQueryProp,
    openOnInputClick = true,
    autoHighlight = false,
    keepHighlight = false,
    highlightItemOnHover = true,
    loopFocus = true,
    itemToStringLabel: itemToStringLabelProp,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
    virtualized = false,
    inline: inlineProp = false,
    fillInputOnItemPress = true,
    modal = false,
    limit = -1,
    autoComplete = 'list',
    formAutoComplete,
    locale,
    submitOnItemClick = false
  } = props;
  const {
    clearErrors
  } = useFormContext();
  const {
    setDirty,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    setTouched,
    setFocused,
    validationMode,
    validation
  } = useFieldRootContext();
  const direction = useDirection();
  const id = useLabelableId({
    id: idProp
  });
  const collatorFilter = useCoreFilter({
    locale
  });

  // Plain items are arrays; normalized `createItems()` collections are objects.
  const collection = Array.isArray(itemsProp) ? null : itemsProp;
  if (collection && typeof collection.label !== 'function') {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: the `items` prop received an object that is not a collection, ' + 'so its items cannot be read. Pass an array of items, an array of groups with items, ' + 'or the result of `createItems()`. ' + 'See https://base-ui.com/react/components/combobox#createitems' : _formatErrorMessage(100));
  }
  const items = collection ? collection.data : itemsProp;
  const itemToValue = collection?.value;

  // A projected collection's items live in the source domain, not the selection-value domain the
  // store matches against, so they are withheld from the store.
  const storeItems = itemToValue ? undefined : items;

  // The externally filtered items projected to their selection values, with a lookup back to the
  // source items. Declared before `itemToStringLabel`, which resolves labels from it on the
  // first render (initial input value).
  const externalWindow = React.useMemo(() => {
    if (!filteredItemsProp || !itemToValue) {
      return undefined;
    }
    const flat = flattenLeafItems(filteredItemsProp);
    const values = flat.map(itemToValue);
    let valueToItem;
    return {
      values,
      findItem(itemValue, isEqual) {
        if (!valueToItem) {
          valueToItem = new Map();
          for (let i = 0; i < values.length; i += 1) {
            if (!valueToItem.has(values[i])) {
              valueToItem.set(values[i], flat[i]);
            }
          }
        }
        return findCollectionItem(valueToItem, itemValue, isEqual);
      }
    };
  }, [filteredItemsProp, itemToValue]);

  // Labels selection values from current props only: collection data first, then the current
  // external window, then the prop. Nothing from a past window is remembered — keeping a value
  // resolvable over time means keeping its item in the collection's data.
  const itemToStringLabel = React.useMemo(() => {
    if (!collection) {
      return itemToStringLabelProp;
    }
    return itemValue => {
      return collection.label(itemValue, isItemEqualToValue, unresolvedValue => {
        const externalItem = externalWindow?.findItem(unresolvedValue, isItemEqualToValue);
        if (externalItem != null) {
          return collection.itemLabel(externalItem);
        }
        return stringifyAsLabel(unresolvedValue, itemToStringLabelProp);
      });
    };
  }, [collection, itemToStringLabelProp, externalWindow, isItemEqualToValue]);
  const filterItemToString = React.useMemo(() => {
    if (!collection) {
      return itemToStringLabelProp;
    }
    return Object.assign(item => collection.itemLabel(item), {
      selected: value => stringifyAsLabel(value, itemToStringLabel)
    });
  }, [collection, itemToStringLabel, itemToStringLabelProp]);
  function stringifyValueLabel(item) {
    return stringifyAsLabel(item, itemToStringLabel);
  }
  const [queryChangedAfterOpen, setQueryChangedAfterOpen] = React.useState(false);
  const [closeQuery, setCloseQuery] = React.useState(null);
  const previousCloseQueryRef = React.useRef(closeQuery);
  const listRef = React.useRef([]);
  const labelsRef = React.useRef([]);
  const popupRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const startDismissRef = React.useRef(null);
  const endDismissRef = React.useRef(null);
  const emptyRef = React.useRef(null);
  const keyboardActiveRef = React.useRef(true);
  const hadInputClearRef = React.useRef(false);
  const chipsContainerRef = React.useRef(null);
  const clearRef = React.useRef(null);
  const selectionEventRef = React.useRef(null);
  const lastHighlightRef = React.useRef(INITIAL_LAST_HIGHLIGHT);
  const pendingQueryHighlightRef = React.useRef(null);

  /**
   * Contains the currently visible list of item values post-filtering.
   */
  const valuesRef = React.useRef([]);
  /**
   * The item element that received the last `pointerdown`, used to detect whether a
   * `mouseup` on an item belongs to a drag-select gesture that started elsewhere.
   */
  const pointerDownItemRef = React.useRef(null);
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const multiple = selectionMode === 'multiple';
  const single = selectionMode === 'single';
  const hasInputValue = inputValueProp !== undefined || defaultInputValue !== undefined;
  const hasItems = items !== undefined;
  const hasFilteredItemsProp = filteredItemsProp !== undefined;
  let autoHighlightMode;
  if (autoHighlight === 'always') {
    autoHighlightMode = 'always';
  } else {
    autoHighlightMode = autoHighlight ? 'input-change' : false;
  }
  const [selectedValue, setSelectedValueUnwrapped] = useControlled({
    controlled: selectedValueProp,
    default: multiple ? defaultSelectedValue ?? EMPTY_ARRAY : defaultSelectedValue,
    name: 'Combobox',
    state: 'selectedValue'
  });
  const filter = React.useMemo(() => {
    if (filterProp === null) {
      return () => true;
    }
    if (filterProp !== undefined) {
      return filterProp;
    }
    // `shouldBypassFiltering` already empties the query whenever a single selection's label
    // matches it exactly, so the filter never needs a selection-aware variant here.
    return createCollatorItemFilter(collatorFilter, filterItemToString);
  }, [filterProp, collatorFilter, filterItemToString]);

  // If neither inputValue nor defaultInputValue are provided, derive it from the
  // selected value for single mode so the input reflects the selection on mount.
  const initialDefaultInputValue = useRefWithInit(() => {
    if (hasInputValue) {
      return defaultInputValue ?? '';
    }
    if (single) {
      return stringifyValueLabel(selectedValue);
    }
    return '';
  }).current;
  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: inputValueProp,
    default: initialDefaultInputValue,
    name: 'Combobox',
    state: 'inputValue'
  });
  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'Combobox',
    state: 'open'
  });
  const isGrouped = isGroupedItems(items);
  const query = !open && closeQuery !== null ? closeQuery : String(inputValue).trim();
  const selectedLabelString = single ? stringifyValueLabel(selectedValue) : '';
  const shouldBypassFiltering = single && !queryChangedAfterOpen && query !== '' && selectedLabelString.length === query.length && collatorFilter.contains(selectedLabelString, query);
  const filterQuery = shouldBypassFiltering ? '' : filterQueryProp ?? query;
  const shouldIgnoreExternalFiltering = hasItems && hasFilteredItemsProp && shouldBypassFiltering && (!collection || collection.hasValue(selectedValue, isItemEqualToValue));
  const flatItems = React.useMemo(() => items ? flattenLeafItems(items) : EMPTY_ARRAY, [items]);
  const filteredItems = React.useMemo(() => {
    if (filteredItemsProp && !shouldIgnoreExternalFiltering) {
      return filteredItemsProp;
    }
    if (!items) {
      return EMPTY_ARRAY;
    }
    if (isGrouped) {
      const groupedItems = items;
      const resultingGroups = [];
      let currentCount = 0;
      for (const group of groupedItems) {
        if (limit > -1 && currentCount >= limit) {
          break;
        }
        const remainingLimit = limit > -1 ? limit - currentCount : Infinity;
        const itemsToTake = filterQuery === '' ? group.items.slice(0, remainingLimit) : [];
        if (filterQuery !== '') {
          for (const item of group.items) {
            if (itemsToTake.length >= remainingLimit) {
              break;
            }
            if (filter(item, filterQuery, filterItemToString)) {
              itemsToTake.push(item);
            }
          }
        }
        if (itemsToTake.length > 0) {
          const newGroup = {
            ...group,
            items: itemsToTake
          };
          resultingGroups.push(newGroup);
          currentCount += itemsToTake.length;
        }
      }
      return resultingGroups;
    }
    if (filterQuery === '') {
      return limit > -1 ? flatItems.slice(0, limit) :
      // The cast here is done as `flatItems` is readonly.
      // valuesRef.current, a mutable ref, can be set to `flatFilteredValues`, which may
      // reference this exact readonly value, creating a mutation risk.
      // However, <Combobox.Item> can never mutate this value as the mutating effect
      // bails early when `items` is provided, and this is only ever returned
      // when `items` is provided due to the early return at the top of this hook.
      flatItems;
    }
    const limitedItems = [];
    for (const item of flatItems) {
      if (limit > -1 && limitedItems.length >= limit) {
        break;
      }
      if (filter(item, filterQuery, filterItemToString)) {
        limitedItems.push(item);
      }
    }
    return limitedItems;
  }, [filteredItemsProp, shouldIgnoreExternalFiltering, items, isGrouped, filterQuery, limit, filter, filterItemToString, flatItems]);

  /**
   * The filtered items flattened across groups and projected to their selection values.
   */
  const flatFilteredValues = React.useMemo(() => {
    if (externalWindow && filteredItems === filteredItemsProp) {
      return externalWindow.values;
    }
    // Explicit type argument: inferring it from a union of both shapes resolves `Item` to
    // `Group<Item>`, which tsc rejects and tsgo does not.
    const flat = flattenLeafItems(filteredItems);
    return itemToValue ? flat.map(item => itemToValue(item)) : flat;
  }, [filteredItems, filteredItemsProp, externalWindow, itemToValue]);
  const store = useRefWithInit(() => {
    // An inline list open on the first render never gets a closed pass of the closed-state
    // sync effect below, and `items`-prop lists don't self-register their index the way
    // individually rendered `<Combobox.Item>`s do, so the selected item was never highlighted.
    // Seeding the index here lets list navigation highlight and scroll to the selection on
    // mount. Computed once by construction, so a selection or list that resolves after mount
    // doesn't move an existing highlight or scroll the list away.
    let initialSelectedIndex = null;
    if (inlineProp && open && hasItems && selectionMode !== 'none') {
      initialSelectedIndex = findSelectionIndex(flatFilteredValues, selectedValue, isItemEqualToValue, multiple);
    }
    return new ReactStore({
      id,
      labelId: undefined,
      selectedValue,
      open,
      items: storeItems,
      selectionMode,
      name,
      form,
      disabled,
      readOnly,
      required,
      grid,
      virtualized,
      openOnInputClick,
      itemToStringLabel,
      isItemEqualToValue,
      modal,
      autoHighlight: autoHighlightMode,
      submitOnItemClick,
      hasInputValue,
      mounted: false,
      forceMounted: false,
      transitionStatus: 'idle',
      inline: inlineProp,
      activeIndex: null,
      selectedIndex: initialSelectedIndex,
      popupProps: {},
      listProps: {},
      inputProps: {},
      triggerProps: {},
      itemProps: EMPTY_OBJECT,
      positionerElement: null,
      listElement: null,
      popupId: undefined,
      triggerElement: null,
      inputElement: null,
      inputGroupElement: null,
      popupSide: null,
      openMethod: null,
      inputInsidePopup: true,
      // Avoid duplicate names in the server HTML. Popup inputs aren't rendered
      // until after hydration, so the hidden input takes over then if needed.
      inputOwnsFormValue: selectionMode === 'none'
    }, {
      // Placeholder callbacks replaced on first render
      onOpenChangeComplete: NOOP,
      setOpen: NOOP,
      setInputValue: NOOP,
      setSelectedValue: NOOP,
      setIndices: NOOP,
      handleSelection: NOOP,
      forceMount: NOOP,
      requestSubmit: NOOP,
      listRef,
      labelsRef,
      popupRef,
      emptyRef,
      inputRef,
      startDismissRef,
      endDismissRef,
      keyboardActiveRef,
      chipsContainerRef,
      clearRef,
      valuesRef,
      pointerDownItemRef,
      selectionEventRef
    }, selectors);
  }).current;
  const fieldRawValue = selectionMode === 'none' ? inputValue : selectedValue;
  const fieldStringValue = React.useMemo(() => {
    if (selectionMode === 'none') {
      return fieldRawValue;
    }
    if (Array.isArray(selectedValue)) {
      return selectedValue.map(value => stringifyAsValue(value, itemToStringValue));
    }
    return stringifyAsValue(selectedValue, itemToStringValue);
  }, [fieldRawValue, itemToStringValue, selectionMode, selectedValue]);
  const onItemHighlighted = useStableCallback(onItemHighlightedProp);
  const onOpenChangeComplete = useStableCallback(onOpenChangeCompleteProp);
  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const triggerElement = store.useState('triggerElement');
  const inputElement = store.useState('inputElement');
  const inputGroupElement = store.useState('inputGroupElement');
  const inline = store.useState('inline');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const inputOwnsFormValue = store.useState('inputOwnsFormValue');
  const inputMatchesSelectedValue = single && !inputInsidePopup && inputValue === selectedLabelString;
  const triggerRef = useValueAsRef(triggerElement);
  const {
    mounted,
    setMounted,
    transitionStatus
  } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps
  } = useOpenInteractionType(open);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);
  useRegisterFieldControl(inputInsidePopup ? triggerRef : inputRef, id, fieldRawValue, getStringifiedValueForForm, !disabled, nameProp);
  const forceMount = useStableCallback(() => {
    if (items) {
      // Ensure typeahead works on a closed list.
      labelsRef.current = flatFilteredValues.map(stringifyValueLabel);
    } else {
      store.set('forceMounted', true);
    }
  });

  /**
   * Emits `onItemHighlighted` for the item at `index`, or clears the highlight when `index` is `-1`
   * (a no-op if nothing was highlighted). Keeps `lastHighlightRef` in sync with what was emitted.
   */
  const emitHighlight = useStableCallback((value, index, type) => {
    if (index === -1) {
      if (lastHighlightRef.current === INITIAL_LAST_HIGHLIGHT) {
        return;
      }
      lastHighlightRef.current = INITIAL_LAST_HIGHLIGHT;
    } else {
      lastHighlightRef.current = {
        value,
        index
      };
    }
    onItemHighlighted(value, createGenericEventDetails(type, undefined, {
      index
    }));
  });
  const setIndices = useStableCallback(options => {
    const update = {};
    if (options.activeIndex !== undefined) {
      update.activeIndex = options.activeIndex;
    }
    if (options.selectedIndex !== undefined) {
      update.selectedIndex = options.selectedIndex;
    }
    store.update(update);
    const activeIndexOption = options.activeIndex;
    if (activeIndexOption === undefined) {
      return;
    }
    const type = options.type || REASONS.none;
    if (activeIndexOption === null) {
      emitHighlight(undefined, -1, type);
    } else {
      emitHighlight(valuesRef.current[activeIndexOption], activeIndexOption, type);
    }
  });
  const setInputValue = useStableCallback((next, eventDetails) => {
    props.onInputValueChange?.(next, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }

    // A canceled selection clear must not suppress close-completion cleanup.
    hadInputClearRef.current = eventDetails.reason === REASONS.inputClear;

    // If user is typing, ensure we don't auto-highlight on open due to a race
    // with the post-open effect that sets this flag.
    if (eventDetails.reason === REASONS.inputChange) {
      // A controlled popup may ignore a close request. Resuming input proves the popup
      // is remaining open, so release the query captured for an exit animation.
      if (open && closeQuery !== null) {
        setCloseQuery(null);
      }
      const event = eventDetails.event;
      const inputType = event.inputType;
      // Treat composition commits as typed input; autofill may omit `inputType` or
      // report `insertReplacementText`.
      const isTypedInput = event.type === 'compositionend' || inputType != null && inputType !== '' && inputType !== 'insertReplacementText';
      if (isTypedInput) {
        const hasQuery = next.trim() !== '';
        if (hasQuery) {
          setQueryChangedAfterOpen(true);
        }
        // Defer index updates until after the filtered items have been derived to ensure
        // `onItemHighlighted` receives the latest item.
        pendingQueryHighlightRef.current = {
          hasQuery
        };

        // Virtualized lists own their scroller. Reset regular lists directly so a stale
        // composite registry cannot select a reordered item and scrolling cannot escape
        // the popup.
        const list = store.state.listElement;
        if (!store.state.virtualized && list) {
          const popup = popupRef.current;
          for (const ancestor of getOverflowAncestors(list.firstElementChild ?? list)) {
            if (!isHTMLElement(ancestor) || (popup ? !contains(popup, ancestor) : ancestor.getAttribute('role') === 'dialog')) {
              break;
            }
            if (isScrollableY(ancestor)) {
              ancestor.scrollTop = 0;
              break;
            }
          }
        }
        if (hasQuery && autoHighlightMode && store.state.activeIndex == null && (open || inline)) {
          store.set('activeIndex', 0);
        }
      }
    } else if (eventDetails.reason === REASONS.inputClear && next === '' && store.state.inputInsidePopup) {
      // A programmatic clear of an active query (e.g. after selecting an item with the
      // input inside the popup): restore the highlight to the selected item.
      pendingQueryHighlightRef.current = {
        hasQuery: false,
        selection: true
      };
    }
    setInputValueUnwrapped(next);
  });
  const handleInterruptedReopen = useStableCallback(isInputChange => {
    // Preserve values supplied with the reopen rather than owned by the interrupted close.
    const clearsPendingInput = !isInputChange && inputInsidePopup && !inline && inputValue !== '' && (String(inputValue).trim() === closeQuery || inputValue === selectedLabelString);

    // Keep the flag while a visible filter survives so the `items` sync cannot overwrite it.
    if (!isInputChange && (clearsPendingInput || inputValue === '' || inputMatchesSelectedValue)) {
      setQueryChangedAfterOpen(false);
    }
    setCloseQuery(null);
    if (clearsPendingInput) {
      // Cleanup clears omit the selection flag and reopening gesture.
      setInputValue('', createChangeEventDetails(REASONS.inputClear));
    }
  });
  const setOpen = useStableCallback((nextOpen, eventDetails) => {
    if (open === nextOpen) {
      return;
    }

    // If the `Empty` component is not used, the positioner or popup should be hidden
    // with CSS. In this case, allow the Escape key to bubble to close a parent popup
    // if there are no items to show.
    if (eventDetails.reason === REASONS.escapeKey && hasItems && flatFilteredValues.length === 0 && !emptyRef.current) {
      eventDetails.allowPropagation();
    }
    props.onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    if (nextOpen && closeQuery !== null) {
      // `ComboboxInput` calls `setInputValue` before `setOpen`, so on an input-change reopen
      // `inputValue` is still the pre-keystroke value and the typed filter always survives.
      handleInterruptedReopen(eventDetails.reason === REASONS.inputChange);
    }
    if (!nextOpen && queryChangedAfterOpen) {
      if (single) {
        if (!inline) {
          setCloseQuery(query);
        }
        // Avoid a flicker when closing the popup with an empty query.
        if (query === '') {
          setQueryChangedAfterOpen(false);
        }
      } else if (multiple) {
        if (!inline) {
          // Freeze the current query so filtering remains stable while exiting.
          setCloseQuery(query);
        }
        if (inputInsidePopup) {
          setIndices({
            activeIndex: null
          });
        }

        // Clear the input immediately on close while retaining filtering via closeQuery for exit animations
        // if the input is outside the popup. When the input is inside the popup, defer the clear until
        // unmount so the filtered list doesn't flash to unfiltered during the exit animation.
        if (!inputInsidePopup || inline) {
          setInputValue('', createChangeEventDetails(REASONS.inputClear, eventDetails.event, undefined, {
            isItemPress: eventDetails.reason === REASONS.itemPress
          }));
        }
      }
    }
    setOpenUnwrapped(nextOpen);
    if (!nextOpen && inputInsidePopup && (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)) {
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
        validation.commit(valueToValidate);
      }
    }
  });
  const setSelectedValue = useStableCallback((nextValue, eventDetails) => {
    // Cast to `any` due to conditional value type (single vs. multiple).
    // The runtime implementation already ensures the correct value shape.
    onSelectedValueChange?.(nextValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setSelectedValueUnwrapped(nextValue);
    const shouldFillInput = selectionMode === 'none' && popupRef.current && fillInputOnItemPress || single && !store.state.inputInsidePopup;
    if (shouldFillInput) {
      setInputValue(stringifyValueLabel(nextValue), createChangeEventDetails(eventDetails.reason, eventDetails.event));
    }
  });
  const handleSelection = useStableCallback((event, itemValue) => {
    const targetEl = getTarget(event);
    const overrideEvent = selectionEventRef.current ?? event;
    selectionEventRef.current = null;
    const eventDetails = createChangeEventDetails(REASONS.itemPress, overrideEvent);

    // Let the link handle the click.
    const href = targetEl?.closest('a')?.getAttribute('href');
    if (href) {
      if (href.startsWith('#')) {
        setOpen(false, eventDetails);
      }
      return;
    }
    if (multiple) {
      const currentSelectedValue = Array.isArray(selectedValue) ? selectedValue : [];
      const isCurrentlySelected = selectedValueIncludes(currentSelectedValue, itemValue, isItemEqualToValue);
      const nextValue = isCurrentlySelected ? removeItem(currentSelectedValue, itemValue, isItemEqualToValue) : [...currentSelectedValue, itemValue];
      setSelectedValue(nextValue, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (!wasFiltering) {
        return;
      }
      if (store.state.inputInsidePopup) {
        setInputValue('', createChangeEventDetails(REASONS.inputClear, eventDetails.event, undefined, {
          isItemPress: true
        }));
        // A newly selected item stays highlighted through the clear; a deselection
        // falls back to the standard selection anchor.
        const pendingHighlight = pendingQueryHighlightRef.current;
        if (pendingHighlight && !isCurrentlySelected) {
          pendingHighlight.toggledValue = itemValue;
        }
      } else {
        setOpen(false, eventDetails);
      }
    } else {
      setSelectedValue(itemValue, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setOpen(false, eventDetails);
    }
  });
  const requestSubmit = useStableCallback(() => {
    const formElement = validation.inputRef.current?.form ?? store.state.inputElement?.form;
    if (formElement && typeof formElement.requestSubmit === 'function') {
      formElement.requestSubmit();
    }
  });
  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);
    setCloseQuery(null);
    if (selectionMode === 'none') {
      setIndices({
        activeIndex: null,
        selectedIndex: null
      });
    } else {
      setIndices({
        activeIndex: null
      });
    }

    // Multiple selection mode:
    // If the user typed a filter and didn't select in multiple mode, clear the input
    // after close completes to avoid mid-exit flicker and start fresh on next open.
    if (multiple && inputRef.current && inputRef.current.value !== '' && !hadInputClearRef.current) {
      setInputValue('', createChangeEventDetails(REASONS.inputClear));
    }

    // Single selection mode:
    // - If input is rendered inside the popup, clear it so the next open is blank
    // - If input is outside the popup, sync it to the selected value
    if (single) {
      if (store.state.inputInsidePopup) {
        if (inputRef.current && inputRef.current.value !== '') {
          setInputValue('', createChangeEventDetails(REASONS.inputClear));
        }
      } else {
        const stringVal = stringifyValueLabel(selectedValue);
        if (inputRef.current && inputRef.current.value !== stringVal) {
          // If no selection was made, treat this as clearing the typed filter.
          const reason = stringVal === '' ? REASONS.inputClear : REASONS.none;
          setInputValue(stringVal, createChangeEventDetails(reason));
        }
      }
    }
  });

  // Support composing the Dialog component around an inline combobox.
  // `[role="dialog"]` is more interoperable than using a context, e.g. it can work
  // with third-party modal libraries, though the limitation is that the closest
  // `role=dialog` part must be the animated element.
  const resolvedPopupRef = React.useMemo(() => {
    if (inline && positionerElement) {
      return {
        current: positionerElement.closest('[role="dialog"]')
      };
    }
    return popupRef;
  }, [inline, positionerElement]);
  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: resolvedPopupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  React.useImperativeHandle(props.actionsRef, () => ({
    unmount: handleUnmount
  }), [handleUnmount]);
  useIsoLayoutEffect(function syncSelectedIndex() {
    const closeQueryReleased = previousCloseQueryRef.current !== null && closeQuery === null;
    previousCloseQueryRef.current = closeQuery;

    // Closing indexes against the frozen filtered list. Reopening releases that query, so its
    // rendered coordinates must be synchronized again even though the popup is already open.
    if (open && (!closeQueryReleased || !hasItems)) {
      return;
    }

    // State-driven (not tied to the internal event path) so controlled closes
    // also clear a pointerdown that never received a matching item mouseup.
    if (!open) {
      pointerDownItemRef.current = null;
    }
    if (selectionMode === 'none') {
      return;
    }

    // Without `items`, look the selection up in the live registry of mounted item
    // values (the list stays mounted while closed when closed-state features need
    // it — trigger interaction and rendered-label autofill force-mount it). Mounted
    // items re-assert the index themselves when their registration moves; when
    // nothing is mounted the lookup resolves to `null` and each item re-registers
    // the index on the next open.
    // Keep the selected index in the coordinates of the list that is actually rendered.
    const registry = hasItems ? flatFilteredValues : valuesRef.current;
    setIndices({
      selectedIndex: findSelectionIndex(registry, selectedValue, isItemEqualToValue, multiple)
    });
  }, [open, closeQuery, selectedValue, selectionMode, multiple, hasItems, flatFilteredValues, isItemEqualToValue, setIndices]);
  useIsoLayoutEffect(() => {
    if (items) {
      valuesRef.current = flatFilteredValues;
      listRef.current.length = flatFilteredValues.length;
    }
  }, [items, flatFilteredValues]);
  useIsoLayoutEffect(() => {
    const pendingHighlight = pendingQueryHighlightRef.current;
    if (pendingHighlight) {
      // A directly rendered list remains visible when the popup state is closed, while a
      // kept-mounted Positioner is hidden and should stay inert.
      const listIsNavigable = open || inline || store.state.positionerElement?.hidden === false;
      if (pendingHighlight.hasQuery) {
        if (autoHighlightMode && listIsNavigable) {
          store.set('activeIndex', 0);
        }
        pendingQueryHighlightRef.current = null;
      } else if (String(inputValue).trim() === '') {
        // Only handle the clear once it has committed (a controlled input may reject it),
        // so a restore cannot fire while a query is still active.
        pendingQueryHighlightRef.current = null;
        if (listIsNavigable) {
          const clearedBySelection = pendingHighlight.selection;
          if (autoHighlightMode === 'always' && !clearedBySelection && store.state.selectionMode === 'none') {
            // There is no selection to restore in Autocomplete. Keep the first-item reset
            // synchronous so list navigation sees it before a directly rendered list closes.
            store.set('activeIndex', 0);
          }

          // Items re-mounted by the clear publish their composite indices in a follow-up
          // commit, so the item registries are mid-update here. Defer past React's cascade.
          queueMicrotask(() => {
            if (!store.state.open && !store.state.inline || inputRef.current && inputRef.current.value.trim() !== '') {
              return;
            }

            // Return the highlight to the selected item, the same anchor the popup uses
            // when it first opens. Read the selection through the store so consumers can
            // pass an inline `isItemEqualToValue` or a fresh `selectedValue` array without
            // re-running this effect on every render.
            const currentSelectedValue = store.state.selectedValue;
            const isMultiple = store.state.selectionMode === 'multiple';
            const hasSelection = isMultiple && Array.isArray(currentSelectedValue) ? currentSelectedValue.length > 0 : store.state.selectionMode !== 'none' && currentSelectedValue != null;
            if (hasSelection) {
              const registry = hasItems || hasFilteredItemsProp ? flatFilteredValues : valuesRef.current;
              // A selection-driven clear keeps the just-selected item highlighted;
              // otherwise return to the open anchor. A selection that is no longer in
              // the list drops the highlight rather than leaving it on whichever item
              // now occupies that index.
              // `findItemIndex` resolves to -1 when no value was toggled.
              const toggledIndex = findItemIndex(registry, pendingHighlight.toggledValue, store.state.isItemEqualToValue);
              store.set('activeIndex', toggledIndex !== -1 ? toggledIndex : findSelectionIndex(registry, currentSelectedValue, store.state.isItemEqualToValue, isMultiple));
            } else if (clearedBySelection) {
              store.set('activeIndex', null);
            } else if (autoHighlightMode === 'always') {
              store.set('activeIndex', 0);
            }
          });
        }
      }
    }
    if (!open && !inline) {
      return;
    }
    const shouldUseFlatFilteredValues = hasItems || hasFilteredItemsProp;
    const candidateItems = shouldUseFlatFilteredValues ? flatFilteredValues : valuesRef.current;
    const storeActiveIndex = store.state.activeIndex;
    if (storeActiveIndex == null) {
      if (autoHighlightMode === 'always' && candidateItems.length > 0) {
        store.set('activeIndex', 0);
        return;
      }
      emitHighlight(undefined, -1, REASONS.none);
      return;
    }
    if (storeActiveIndex >= candidateItems.length) {
      emitHighlight(undefined, -1, REASONS.none);
      store.set('activeIndex', null);
      return;
    }
    const itemValue = candidateItems[storeActiveIndex];
    const previouslyHighlightedItemValue = lastHighlightRef.current.value;
    const isSameItem = previouslyHighlightedItemValue !== NO_ACTIVE_VALUE && compareItemEquality(itemValue, previouslyHighlightedItemValue, store.state.isItemEqualToValue);
    if (lastHighlightRef.current.index !== storeActiveIndex || !isSameItem) {
      emitHighlight(itemValue, storeActiveIndex, REASONS.none);
    }
  }, [activeIndex, autoHighlightMode, emitHighlight, hasFilteredItemsProp, hasItems, flatFilteredValues, inline, open, store,
  // Reruns the effect when the query changes without affecting the deps above, such as
  // clearing the input when no items are filtered out (individually rendered items).
  inputValue]);
  useIsoLayoutEffect(() => {
    if (selectionMode === 'none') {
      setFilled(String(inputValue) !== '');
      return;
    }
    setFilled(multiple ? Array.isArray(selectedValue) && selectedValue.length > 0 : selectedValue != null);
  }, [setFilled, selectionMode, inputValue, selectedValue, multiple]);

  // Ensures that the active index is not set to 0 when the list is empty.
  // This avoids needing to press ArrowDown twice under certain conditions.
  React.useEffect(() => {
    if (hasItems && autoHighlightMode && flatFilteredValues.length === 0) {
      setIndices({
        activeIndex: null
      });
    }
  }, [hasItems, autoHighlightMode, flatFilteredValues.length, setIndices]);
  function handleQueryChanged() {
    if (open && query !== '' && query !== String(initialDefaultInputValue) && !inputMatchesSelectedValue) {
      setQueryChangedAfterOpen(true);
    }
  }
  function handleOpenChanged() {
    // A controlled `open` prop can interrupt the close without calling `setOpen`.
    if (open && closeQuery !== null) {
      handleInterruptedReopen(false);
    }
  }

  // These sync triggers can run in the same commit while still seeing the pre-commit `inputValue`.
  // This render-scoped flag prevents duplicate callbacks and resets so canceled writes can retry.
  let syncedSelectedLabel = false;
  function syncInputToSelectedLabel() {
    if (!syncedSelectedLabel && inputValue !== selectedLabelString) {
      syncedSelectedLabel = true;
      setInputValue(selectedLabelString, createChangeEventDetails(REASONS.none));
    }
  }
  function handleSelectedValueChanged() {
    if (selectionMode === 'none') {
      return;
    }
    clearErrors(name);
    setDirty(isSelectedValueDirty(selectedValue, validityData.initialValue, isItemEqualToValue));
    validation.change(selectedValue);
    if (single && !hasInputValue && !inputInsidePopup) {
      syncInputToSelectedLabel();
    }
  }

  // The label catches accessor changes while the items identity restores the selected label after
  // a one-step input clear followed by a data reload. The shared sync prevents duplicate writes
  // when both change in the same commit.
  function syncInputAfterItemsOrLabelChange() {
    if (single && !hasInputValue && !inputInsidePopup && !queryChangedAfterOpen) {
      syncInputToSelectedLabel();
    }
  }
  function handleInputValueChanged() {
    if (selectionMode !== 'none') {
      return;
    }
    clearErrors(name);
    setDirty(inputValue !== validityData.initialValue);
    validation.change(inputValue);
  }
  useValueChanged(query, handleQueryChanged);
  useValueChanged(open, handleOpenChanged);
  useValueChanged(selectedValue, handleSelectedValueChanged);
  useValueChanged(selectedLabelString, syncInputAfterItemsOrLabelChange);
  useValueChanged(items, syncInputAfterItemsOrLabelChange);
  useValueChanged(inputValue, handleInputValueChanged);
  const floatingRootContext = useFloatingRootContext({
    open: inline ? true : open,
    onOpenChange: setOpen,
    elements: {
      reference: inputInsidePopup ? triggerElement : inputElement,
      floating: positionerElement
    }
  });
  const ariaHasPopup = grid ? 'grid' : 'listbox';
  // An inline list isn't gated on `open`: it renders for as long as it's in the tree, so the
  // combobox is permanently expanded even while the internal open state is `false`.
  const expanded = open || inline;
  const ariaExpanded = expanded ? 'true' : 'false';
  const role = React.useMemo(() => {
    const isPlainInput = inputElement?.tagName === 'INPUT';
    // During SSR and initial hydration, the input ref is not available yet.
    // Assume an input-like control so combobox ARIA attributes are present.
    const shouldTreatAsInput = inputElement == null || isPlainInput;
    // A non-input control only takes on combobox semantics while the list is exposed, which for
    // an inline list is the whole time.
    const shouldApplyAria = shouldTreatAsInput || expanded;
    const reference = shouldTreatAsInput ? {
      autoComplete: 'off',
      spellCheck: 'false',
      autoCorrect: 'off',
      autoCapitalize: 'none'
    } : {};
    if (shouldApplyAria) {
      reference.role = 'combobox';
      reference['aria-expanded'] = ariaExpanded;
      reference['aria-haspopup'] = ariaHasPopup;
      reference['aria-controls'] = expanded ? listElement?.id : undefined;
      // `readOnly` accepts no input, so no completion of any kind is offered.
      reference['aria-autocomplete'] = readOnly ? 'none' : autoComplete;
    }
    return {
      reference,
      floating: {
        role: 'presentation'
      }
    };
  }, [inputElement, expanded, ariaExpanded, ariaHasPopup, listElement?.id, autoComplete, readOnly]);

  // `readOnly` locks the value, not the interaction: the popup opens and can be browsed.
  // Value changes stay blocked in `ComboboxItem`, `ComboboxInput`'s keydown, `ComboboxTrigger`'s
  // typeahead, the clear/remove parts, and the hidden input's autofill handler.
  const click = useClick(floatingRootContext, {
    enabled: !disabled && openOnInputClick,
    event: 'mousedown-only',
    toggle: false,
    // Apply a small delay for touch to let mobile viewport/keyboard positioning settle.
    // This avoids top-bottom flip flickers if the preferred position is "top" when first tapping.
    touchOpenDelay: inputInsidePopup ? 0 : 100,
    reason: REASONS.inputPress
  });
  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled && !inline,
    outsidePressEvent: {
      mouse: 'sloppy',
      // The visual viewport (affected by the mobile software keyboard) can be
      // somewhat small. The user may want to scroll the screen to see more of
      // the popup.
      touch: 'intentional'
    },
    // Without a popup, let the Escape key bubble the event up to other popups' handlers.
    bubbles: inline ? true : undefined,
    outsidePress(event) {
      const target = getTarget(event);
      return !contains(triggerElement, target) && !contains(clearRef.current, target) && !contains(chipsContainerRef.current, target) && !contains(inputGroupElement, target);
    }
  });
  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    id,
    listRef,
    activeIndex,
    selectedIndex,
    virtual: true,
    loopFocus,
    allowEscape: loopFocus && !autoHighlightMode,
    focusItemOnOpen: queryChangedAfterOpen || selectionMode === 'none' && !autoHighlightMode ? false : 'auto',
    focusItemOnHover: highlightItemOnHover,
    resetOnPointerLeave: !keepHighlight,
    orientation: grid ? 'horizontal' : undefined,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    grid: grid ? gridNavigation : undefined,
    onNavigate(nextActiveIndex, event) {
      // Retain the highlight only while actually transitioning out or closed.
      if (!event && !open || transitionStatus === 'ending') {
        return;
      }
      if (!event) {
        setIndices({
          activeIndex: nextActiveIndex
        });
      } else {
        setIndices({
          activeIndex: nextActiveIndex,
          type: keyboardActiveRef.current ? REASONS.keyboard : REASONS.pointer
        });
      }
    }
  });
  const inputProps = React.useMemo(() => mergeProps(listNavigation.reference, {
    onKeyDown(event) {
      // In grid mode the navigation hook treats ArrowLeft/ArrowRight as horizontal
      // grid movement. When the input has focus and no item is highlighted the user
      // is still editing the query, so let the input keep its native caret behavior.
      if (grid && store.state.activeIndex == null && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventBaseUIHandler();
      }
    }
  }, dismiss.reference, click.reference, role.reference), [listNavigation.reference, dismiss.reference, click.reference, role.reference, grid, store]);
  const popupProps = React.useMemo(() => mergeProps(FOCUSABLE_POPUP_PROPS, dismiss.floating), [dismiss.floating]);
  const listProps = React.useMemo(() => mergeProps(listNavigation.floating, role.floating), [listNavigation.floating, role.floating]);
  const itemProps = React.useMemo(() => {
    const listNavigationItemProps = listNavigation.item;
    if (!listNavigationItemProps) {
      return EMPTY_OBJECT;
    }

    // Combobox keeps focus on the input; item focus would incorrectly sync
    // list navigation state from DOM focus.
    return {
      ...listNavigationItemProps,
      onFocus: undefined
    };
  }, [listNavigation.item]);
  store.useContextCallback('setOpen', setOpen);
  store.useContextCallback('setInputValue', setInputValue);
  store.useContextCallback('setSelectedValue', setSelectedValue);
  store.useContextCallback('setIndices', setIndices);
  store.useContextCallback('handleSelection', handleSelection);
  store.useContextCallback('forceMount', forceMount);
  store.useContextCallback('requestSubmit', requestSubmit);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeCompleteProp);

  // The prop bags must be in the store before the parts render: they read them with `useStore`
  // during render, and a layout effect commits only after all children have rendered.
  useOnFirstRender(() => {
    store.update({
      inline: inlineProp,
      popupProps,
      listProps,
      inputProps,
      triggerProps,
      itemProps
    });
  });
  const syncedValues = {
    id,
    selectedValue,
    open,
    mounted,
    transitionStatus,
    items: storeItems,
    inline: inlineProp,
    popupProps,
    listProps,
    inputProps,
    triggerProps,
    itemProps,
    openMethod,
    selectionMode,
    name,
    form,
    disabled,
    readOnly,
    required,
    grid,
    virtualized,
    openOnInputClick,
    itemToStringLabel,
    modal,
    autoHighlight: autoHighlightMode,
    isItemEqualToValue,
    submitOnItemClick,
    hasInputValue
  };
  useIsoLayoutEffect(() => {
    // `inputOwnsFormValue` is derived here rather than during render because `ComboboxInput`
    // writes it from a ref callback earlier in the same commit, and it has to land in this same
    // `update` so subscribers never observe an intermediate snapshot. That is also why
    // `store.useSyncedValues` can't be used yet: it would need a second write. The dependencies
    // are derived from `syncedValues` so a newly synchronized field can't be forgotten here.
    store.update({
      ...syncedValues,
      inputOwnsFormValue: selectionMode === 'none' && (inlineProp || !store.state.inputInsidePopup)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, ...Object.values(syncedValues)]);
  const hiddenInputRef = useMergedRefs(inputRefProp, validation.inputRef);
  const itemsContextValue = React.useMemo(() => ({
    query,
    hasItems,
    filteredItems,
    flatFilteredValues
  }), [query, hasItems, filteredItems, flatFilteredValues]);
  const serializedValue = React.useMemo(() => {
    if (Array.isArray(fieldRawValue)) {
      return '';
    }
    return stringifyAsValue(fieldRawValue, itemToStringValue);
  }, [fieldRawValue, itemToStringValue]);
  const hasMultipleSelection = multiple && Array.isArray(selectedValue) && selectedValue.length > 0;
  const hiddenInputName = multiple || selectionMode === 'none' && inputOwnsFormValue ? undefined : name;
  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(selectedValue) || !name) {
      return null;
    }
    return selectedValue.map(value => {
      const currentSerializedValue = stringifyAsValue(value, itemToStringValue);
      return /*#__PURE__*/_jsx("input", {
        type: "hidden",
        form: form,
        name: name,
        value: currentSerializedValue,
        disabled: disabled
      }, currentSerializedValue);
    });
  }, [multiple, selectedValue, form, name, itemToStringValue, disabled]);
  const children = /*#__PURE__*/_jsxs(React.Fragment, {
    children: [props.children, /*#__PURE__*/_jsx("input", {
      ...validation.getValidationProps(disabled, {
        // Move focus when the hidden input is focused.
        onFocus() {
          if (inputInsidePopup) {
            triggerElement?.focus();
            return;
          }
          (inputRef.current || triggerElement)?.focus();
        },
        // Handle browser autofill.
        onChange(event) {
          // Workaround for https://github.com/react/react/issues/9023
          if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
            return;
          }
          const nextValue = event.currentTarget.value;
          const nextValueLower = nextValue.toLowerCase();
          const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
          const findSerializedMatchIndex = () => valuesRef.current.findIndex(candidate => stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower || stringifyValueLabel(candidate).toLowerCase() === nextValueLower);
          function handleChange() {
            // Browser autofill only writes a single scalar value.
            if (multiple) {
              return;
            }
            if (selectionMode === 'none') {
              setInputValue(nextValue, details);
              return;
            }

            // Preserve the original serialized matching, then fall back to rendered text,
            // which browsers can autofill for primitive values like `value="US">United States`.
            let matchingIndex = findSerializedMatchIndex();
            if (matchingIndex === -1) {
              matchingIndex = valuesRef.current.findIndex((_, index) => {
                const renderedLabel = labelsRef.current[index];
                return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
              });
            }
            const matchingValue = matchingIndex === -1 ? undefined : valuesRef.current[matchingIndex];
            if (matchingValue != null) {
              // `setSelectedValue` may be canceled by `onValueChange`; rely on
              // `useValueChanged` to mark the field dirty and run validation only
              // when the value actually changes.
              setSelectedValue?.(matchingValue, details);
            }
          }

          // Only single-selection autofill matches against the registered values/labels.
          // `multiple` ignores autofill and `none` just writes the input value, so avoid the
          // sticky `forceMounted` mount (which never resets) for those modes.
          if (single) {
            forceMount();
            if (items && findSerializedMatchIndex() === -1) {
              // `forceMount` only refreshes the derived labels for the `items` prop. When
              // serialized matching misses, also mount the list so rendered labels (which can
              // differ from the serialized values) are registered for autofill matching.
              store.set('forceMounted', true);
            }
          }
          queueMicrotask(handleChange);
        }
      }),
      id: id && hiddenInputName == null ? `${id}-hidden-input` : undefined,
      form: form,
      name: hiddenInputName,
      autoComplete: formAutoComplete,
      disabled: disabled,
      required: required && !hasMultipleSelection,
      readOnly: readOnly,
      value: serializedValue,
      ref: hiddenInputRef,
      style: hiddenInputName ? visuallyHiddenInput : visuallyHidden,
      tabIndex: -1,
      "aria-hidden": true,
      suppressHydrationWarning: true
    }), hiddenInputs]
  });
  return /*#__PURE__*/_jsx(ComboboxRootContext.Provider, {
    value: store,
    children: /*#__PURE__*/_jsx(ComboboxFloatingContext.Provider, {
      value: floatingRootContext,
      children: /*#__PURE__*/_jsx(ComboboxHasItemsContext.Provider, {
        value: hasItems,
        children: /*#__PURE__*/_jsx(ComboboxDerivedItemsContext.Provider, {
          value: itemsContextValue,
          children: /*#__PURE__*/_jsx(ComboboxInputValueContext.Provider, {
            value: inputValue,
            children: children
          })
        })
      })
    })
  });
}