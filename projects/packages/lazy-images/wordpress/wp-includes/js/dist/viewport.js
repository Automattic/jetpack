/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ifViewportMatches: () => (/* reexport */ if_viewport_matches),
  store: () => (/* reexport */ store),
  withViewportMatch: () => (/* reexport */ with_viewport_match)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/viewport/build-module/store/actions.js
var actions_namespaceObject = {};
__webpack_require__.r(actions_namespaceObject);
__webpack_require__.d(actions_namespaceObject, {
  setIsMatching: () => (setIsMatching)
});

// NAMESPACE OBJECT: ./node_modules/@wordpress/viewport/build-module/store/selectors.js
var selectors_namespaceObject = {};
__webpack_require__.r(selectors_namespaceObject);
__webpack_require__.d(selectors_namespaceObject, {
  isViewportMatch: () => (isViewportMatch)
});

;// CONCATENATED MODULE: external ["wp","compose"]
const external_wp_compose_namespaceObject = window["wp"]["compose"];
;// CONCATENATED MODULE: external ["wp","data"]
const external_wp_data_namespaceObject = window["wp"]["data"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/store/reducer.js
/**
 * Reducer returning the viewport state, as keys of breakpoint queries with
 * boolean value representing whether query is matched.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function reducer(state = {}, action) {
  switch (action.type) {
    case 'SET_IS_MATCHING':
      return action.values;
  }
  return state;
}
/* harmony default export */ const store_reducer = (reducer);

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/store/actions.js
/**
 * Returns an action object used in signalling that viewport queries have been
 * updated. Values are specified as an object of breakpoint query keys where
 * value represents whether query matches.
 * Ignored from documentation as it is for internal use only.
 *
 * @ignore
 *
 * @param {Object} values Breakpoint query matches.
 *
 * @return {Object} Action object.
 */
function setIsMatching(values) {
  return {
    type: 'SET_IS_MATCHING',
    values
  };
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/store/selectors.js
/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param {Object} state Viewport state object.
 * @param {string} query Query string. Includes operator and breakpoint name,
 *                       space separated. Operator defaults to >=.
 *
 * @example
 *
 * ```js
 * import { store as viewportStore } from '@wordpress/viewport';
 * import { useSelect } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 * const ExampleComponent = () => {
 *     const isMobile = useSelect(
 *         ( select ) => select( viewportStore ).isViewportMatch( '< small' ),
 *         []
 *     );
 *
 *     return isMobile ? (
 *         <div>{ __( 'Mobile' ) }</div>
 *     ) : (
 *         <div>{ __( 'Not Mobile' ) }</div>
 *     );
 * };
 * ```
 *
 * @return {boolean} Whether viewport matches query.
 */
function isViewportMatch(state, query) {
  // Default to `>=` if no operator is present.
  if (query.indexOf(' ') === -1) {
    query = '>= ' + query;
  }
  return !!state[query];
}

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/store/index.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */



const STORE_NAME = 'core/viewport';

/**
 * Store definition for the viewport namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
const store = (0,external_wp_data_namespaceObject.createReduxStore)(STORE_NAME, {
  reducer: store_reducer,
  actions: actions_namespaceObject,
  selectors: selectors_namespaceObject
});
(0,external_wp_data_namespaceObject.register)(store);

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/listener.js
/**
 * WordPress dependencies
 */



/**
 * Internal dependencies
 */

const addDimensionsEventListener = (breakpoints, operators) => {
  /**
   * Callback invoked when media query state should be updated. Is invoked a
   * maximum of one time per call stack.
   */
  const setIsMatching = (0,external_wp_compose_namespaceObject.debounce)(() => {
    const values = Object.fromEntries(queries.map(([key, query]) => [key, query.matches]));
    (0,external_wp_data_namespaceObject.dispatch)(store).setIsMatching(values);
  }, 0, {
    leading: true
  });

  /**
   * Hash of breakpoint names with generated MediaQueryList for corresponding
   * media query.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
   * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
   *
   * @type {Object<string,MediaQueryList>}
   */
  const operatorEntries = Object.entries(operators);
  const queries = Object.entries(breakpoints).flatMap(([name, width]) => {
    return operatorEntries.map(([operator, condition]) => {
      const list = window.matchMedia(`(${condition}: ${width}px)`);
      list.addEventListener('change', setIsMatching);
      return [`${operator} ${name}`, list];
    });
  });
  window.addEventListener('orientationchange', setIsMatching);

  // Set initial values.
  setIsMatching();
  setIsMatching.flush();
};
/* harmony default export */ const listener = (addDimensionsEventListener);

;// CONCATENATED MODULE: external "React"
const external_React_namespaceObject = window["React"];
;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/with-viewport-match.js

/**
 * WordPress dependencies
 */


/**
 * Higher-order component creator, creating a new component which renders with
 * the given prop names, where the value passed to the underlying component is
 * the result of the query assigned as the object's value.
 *
 * @see isViewportMatch
 *
 * @param {Object} queries Object of prop name to viewport query.
 *
 * @example
 *
 * ```jsx
 * function MyComponent( { isMobile } ) {
 * 	return (
 * 		<div>Currently: { isMobile ? 'Mobile' : 'Not Mobile' }</div>
 * 	);
 * }
 *
 * MyComponent = withViewportMatch( { isMobile: '< small' } )( MyComponent );
 * ```
 *
 * @return {Function} Higher-order component.
 */
const withViewportMatch = queries => {
  const queryEntries = Object.entries(queries);
  const useViewPortQueriesResult = () => Object.fromEntries(queryEntries.map(([key, query]) => {
    let [operator, breakpointName] = query.split(' ');
    if (breakpointName === undefined) {
      breakpointName = operator;
      operator = '>=';
    }
    // Hooks should unconditionally execute in the same order,
    // we are respecting that as from the static query of the HOC we generate
    // a hook that calls other hooks always in the same order (because the query never changes).
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return [key, (0,external_wp_compose_namespaceObject.useViewportMatch)(breakpointName, operator)];
  }));
  return (0,external_wp_compose_namespaceObject.createHigherOrderComponent)(WrappedComponent => {
    return (0,external_wp_compose_namespaceObject.pure)(props => {
      const queriesResult = useViewPortQueriesResult();
      return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
        ...props,
        ...queriesResult
      });
    });
  }, 'withViewportMatch');
};
/* harmony default export */ const with_viewport_match = (withViewportMatch);

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/if-viewport-matches.js
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */


/**
 * Higher-order component creator, creating a new component which renders if
 * the viewport query is satisfied.
 *
 * @see withViewportMatches
 *
 * @param {string} query Viewport query.
 *
 * @example
 *
 * ```jsx
 * function MyMobileComponent() {
 * 	return <div>I'm only rendered on mobile viewports!</div>;
 * }
 *
 * MyMobileComponent = ifViewportMatches( '< small' )( MyMobileComponent );
 * ```
 *
 * @return {Function} Higher-order component.
 */
const ifViewportMatches = query => (0,external_wp_compose_namespaceObject.createHigherOrderComponent)((0,external_wp_compose_namespaceObject.compose)([with_viewport_match({
  isViewportMatch: query
}), (0,external_wp_compose_namespaceObject.ifCondition)(props => props.isViewportMatch)]), 'ifViewportMatches');
/* harmony default export */ const if_viewport_matches = (ifViewportMatches);

;// CONCATENATED MODULE: ./node_modules/@wordpress/viewport/build-module/index.js
/**
 * Internal dependencies
 */





/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 *
 * @type {Object}
 */
const BREAKPOINTS = {
  huge: 1440,
  wide: 1280,
  large: 960,
  medium: 782,
  small: 600,
  mobile: 480
};

/**
 * Hash of query operators with corresponding condition for media query.
 *
 * @type {Object}
 */
const OPERATORS = {
  '<': 'max-width',
  '>=': 'min-width'
};
listener(BREAKPOINTS, OPERATORS);

(window.wp = window.wp || {}).viewport = __webpack_exports__;
/******/ })()
;