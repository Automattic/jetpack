"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gridNavigation = gridNavigation;
var _composite = require("../../../floating-ui-react/utils/composite");
var _composite2 = require("../composite");
/**
 * Builds the grid navigation handler passed to `CompositeRoot`/`useCompositeRoot`
 * via the `grid` prop. Importing and calling this is the opt-in for grid
 * navigation: composites that don't pass `grid` never reference the algorithm,
 * so bundlers tree-shake the grid helpers out.
 */
function gridNavigation(config) {
  const {
    cols,
    dense = false,
    itemSizes
  } = config;
  return state => {
    const {
      disabledIndices,
      elementsRef,
      event,
      highlightedIndex,
      loopFocus,
      maxIndex,
      minIndex,
      onLoop,
      orientation,
      rtl
    } = state;
    const sizes = itemSizes || Array.from({
      length: elementsRef.current.length
    }, () => ({
      width: 1,
      height: 1
    }));
    // Work in hypothetical 1x1 cell indices, then convert back to item indices.
    const cellMap = (0, _composite.createGridCellMap)(sizes, cols, dense);
    const minGridIndex = cellMap.findIndex(index => index != null && !(0, _composite.isListIndexDisabled)(elementsRef.current, index, disabledIndices));
    const maxGridIndex = cellMap.reduce((foundIndex, index, cellIndex) => index != null && !(0, _composite.isListIndexDisabled)(elementsRef.current, index, disabledIndices) ? cellIndex : foundIndex, -1);
    const cellIndex = (0, _composite.getGridNavigatedIndex)(cellMap.map(itemIndex => itemIndex != null ? elementsRef.current[itemIndex] : null), {
      event,
      orientation,
      loopFocus,
      onLoop,
      cols,
      // Treat undefined gaps as disabled so navigation cannot land in them.
      disabledIndices: (0, _composite.getGridCellIndices)([...(disabledIndices || elementsRef.current.map((_, index) => (0, _composite.isListIndexDisabled)(elementsRef.current, index) ? index : undefined)), undefined], cellMap),
      minIndex: minGridIndex,
      maxIndex: maxGridIndex,
      prevIndex: (0, _composite.getGridCellIndexOfCorner)(highlightedIndex > maxIndex ? minIndex : highlightedIndex, sizes, cellMap, cols,
      // Choose the corner closest to the movement direction so spanning items
      // do not immediately resolve back to themselves.
      // eslint-disable-next-line no-nested-ternary
      event.key === _composite2.ARROW_DOWN ? 'bl' : event.key === (rtl ? _composite2.ARROW_LEFT : _composite2.ARROW_RIGHT) ? 'tr' : 'tl'),
      rtl
    });

    // Navigated cell will never be nullish.
    return cellMap[cellIndex];
  };
}