import { getContext, store } from '@wordpress/interactivity';
import { fetchSuggestions } from '../../store/suggestions-api';
import 'jetpack-search/store';
import { buildSuggestionRows, countOptions, rowAtOptionIndex } from './suggestion-rows';
import './style.scss';

const NAMESPACE = 'jetpack-search';
const SEARCH_DEBOUNCE_MS = 300;
const SUGGESTIONS_DEBOUNCE_MS = 120;
const SUGGESTIONS_BLUR_CLOSE_MS = 150;

// Per-input timer / abort state. WeakMaps keyed by the input element itself
// so two `search-input` blocks on the same page (header + sidebar) don't
// reset each other's timers or abort each other's suggestions request, and
// so GC can reclaim the entries automatically when an input leaves the DOM.
const debounceTimers = new WeakMap();
const suggestionTimers = new WeakMap();
const blurTimers = new WeakMap();
const suggestionAborts = new WeakMap();

/**
 * Start (or restart) the debounced search for a single input.
 *
 * @param {HTMLInputElement} input - The input whose timer should be reset.
 */
function scheduleSearch( input ) {
	clearTimeout( debounceTimers.get( input ) );
	const timer = setTimeout( () => {
		debounceTimers.delete( input );
		const { actions } = store( NAMESPACE );
		actions.search();
	}, SEARCH_DEBOUNCE_MS );
	debounceTimers.set( input, timer );
}

/**
 * Cancel any in-flight search debounce for a single input — used when a
 * keystroke should fire a search immediately (e.g. Enter).
 *
 * @param {HTMLInputElement} input - The input whose timer should be cleared.
 */
function cancelPendingSearch( input ) {
	clearTimeout( debounceTimers.get( input ) );
	debounceTimers.delete( input );
}

/**
 * Start (or restart) the debounced suggestions fetch for a single input.
 * Runs faster than the search debounce so the dropdown feels responsive —
 * 120 ms is short enough to keep up with quick typing but long enough to
 * coalesce held keys into one request. The caller passes the per-instance
 * Interactivity context proxy so the deferred action can mutate it
 * directly — `getContext()` from inside a `setTimeout` would return null
 * because context tracking is only live inside the originating handler.
 *
 * @param {HTMLInputElement} input - The input whose timer should be reset.
 * @param {object}           ctx   - The per-instance context to mutate when the fetch lands.
 */
function scheduleSuggestions( input, ctx ) {
	clearTimeout( suggestionTimers.get( input ) );
	const timer = setTimeout( () => {
		suggestionTimers.delete( input );
		const { actions } = store( NAMESPACE );
		actions.fetchSuggestionsFor( input, ctx );
	}, SUGGESTIONS_DEBOUNCE_MS );
	suggestionTimers.set( input, timer );
}

/**
 * Cancel a pending suggestions debounce and abort any in-flight request.
 *
 * @param {HTMLInputElement} input - The input being reset.
 */
function cancelPendingSuggestions( input ) {
	clearTimeout( suggestionTimers.get( input ) );
	suggestionTimers.delete( input );
	const controller = suggestionAborts.get( input );
	if ( controller ) {
		controller.abort();
		suggestionAborts.delete( input );
	}
}

store( NAMESPACE, {
	state: {
		/**
		 * Whether the row currently being rendered by `data-wp-each` is the
		 * keyboard-highlighted option. The Interactivity API only evaluates
		 * simple property paths on `data-wp-bind`, so this getter encapsulates
		 * the `row.optionIndex === context.activeIndex` comparison both the
		 * `aria-selected` binding and the `is-active` class binding need.
		 *
		 * @return {boolean} True when the current row should look active.
		 */
		get isRowActive() {
			const ctx = getContext();
			const row = ctx?.row;
			if ( ! row || row.isHeader ) {
				return false;
			}
			return row.optionIndex === ctx.activeIndex;
		},
	},

	actions: {
		onSearchInput( event ) {
			const { state } = store( NAMESPACE );
			state.searchQuery = event.target.value;
			// `submitOnly` inputs still keep `state.searchQuery` in sync so
			// bindings render the typed value, but defer the actual API call
			// until Enter / the clear button — useful for sites that want
			// fewer requests than the default live-search debounce produces.
			if ( event.target.dataset.submitOnly === 'true' ) {
				cancelPendingSearch( event.target );
			} else {
				scheduleSearch( event.target );
			}

			// Suggestions debounce runs alongside the search debounce when
			// the block opted in. A separate timer (and a shorter window)
			// keeps the dropdown feeling responsive even on `submitOnly`
			// blocks where the main search waits for Enter. The context
			// proxy is captured here and threaded into the deferred action
			// because `getContext()` won't resolve inside the setTimeout.
			if ( event.target.dataset.suggestionsEnabled === 'true' ) {
				scheduleSuggestions( event.target, getContext() );
			}
		},

		onSearchKeydown( event ) {
			const input = event.target;
			const suggestionsEnabled = input.dataset.suggestionsEnabled === 'true';
			const ctx = suggestionsEnabled ? getContext() : null;
			const rows = ctx?.rows ?? [];
			const optionCount = countOptions( rows );

			switch ( event.key ) {
				case 'ArrowDown':
					if ( ! suggestionsEnabled || optionCount === 0 ) {
						return;
					}
					event.preventDefault();
					ctx.showSuggestions = true;
					ctx.activeIndex =
						ctx.activeIndex < optionCount - 1 ? ctx.activeIndex + 1 : ctx.activeIndex;
					ctx.activeOptionId = rowAtOptionIndex( rows, ctx.activeIndex )?.optionId ?? '';
					return;
				case 'ArrowUp':
					if ( ! suggestionsEnabled || optionCount === 0 ) {
						return;
					}
					event.preventDefault();
					ctx.activeIndex = ctx.activeIndex > 0 ? ctx.activeIndex - 1 : -1;
					ctx.activeOptionId = rowAtOptionIndex( rows, ctx.activeIndex )?.optionId ?? '';
					return;
				case 'Escape':
					if ( ! suggestionsEnabled ) {
						return;
					}
					ctx.showSuggestions = false;
					ctx.activeIndex = -1;
					ctx.activeOptionId = '';
					return;
				case 'Enter': {
					if ( suggestionsEnabled && ctx.showSuggestions && ctx.activeIndex >= 0 ) {
						const row = rowAtOptionIndex( rows, ctx.activeIndex );
						if ( row ) {
							event.preventDefault();
							cancelPendingSearch( input );
							cancelPendingSuggestions( input );
							const { actions } = store( NAMESPACE );
							actions.acceptSuggestion( row );
							return;
						}
					}
					if ( suggestionsEnabled ) {
						ctx.showSuggestions = false;
						ctx.activeIndex = -1;
						ctx.activeOptionId = '';
					}
					cancelPendingSearch( input );
					cancelPendingSuggestions( input );
					const { actions } = store( NAMESPACE );
					actions.search();
					break;
				}
				default:
					break;
			}
		},

		onSearchFocus( event ) {
			// Re-opening the dropdown on focus only matters when there are
			// suggestions to show — otherwise we'd flash an empty `<ul>`.
			const ctx = getContext();
			const input = event.target;
			clearTimeout( blurTimers.get( input ) );
			blurTimers.delete( input );
			if ( ctx?.rows?.length > 0 ) {
				ctx.showSuggestions = true;
			}
		},

		onSearchBlur( event ) {
			// 150 ms grace period before closing — matches the instant-search
			// overlay's behavior and lets a click on a suggestion `<li>`
			// fire its `click` handler before the dropdown disappears.
			const ctx = getContext();
			const input = event.target;
			clearTimeout( blurTimers.get( input ) );
			const timer = setTimeout( () => {
				blurTimers.delete( input );
				ctx.showSuggestions = false;
				ctx.activeIndex = -1;
				ctx.activeOptionId = '';
			}, SUGGESTIONS_BLUR_CLOSE_MS );
			blurTimers.set( input, timer );
		},

		onSuggestionMousedown( event ) {
			// Stop the input from blurring before the click fires, otherwise
			// the blur handler would close the dropdown and cancel the click.
			event.preventDefault();
		},

		onSuggestionClick() {
			const ctx = getContext();
			const row = ctx?.row;
			if ( ! row || row.isHeader ) {
				return;
			}
			const { actions } = store( NAMESPACE );
			actions.acceptSuggestion( row );
		},

		/**
		 * Apply a selected suggestion. Dispatches one of three behaviors:
		 * `query` fills the input, closes the dropdown, and fires a search;
		 * `taxonomy` applies as a filter on the current page when a matching
		 * taxonomy filter is registered (so the result list refreshes inline),
		 * otherwise navigates to the archive URL; `post` navigates to the
		 * post URL.
		 *
		 * The `row` argument is whatever `buildSuggestionRows` produced
		 * (not the raw API item), so `taxonomy` and `slug` are already
		 * URL-recovered when the API omitted them.
		 *
		 * @param {object} row - Selected suggestion row.
		 */
		acceptSuggestion( row ) {
			const { state, actions } = store( NAMESPACE );

			// Close the dropdown on the originating input. The action is
			// dispatched from the suggestion `<li>` so getContext() resolves
			// to the wrapper's context — same instance the input lives in.
			const ctx = getContext();
			if ( ctx ) {
				ctx.showSuggestions = false;
				ctx.activeIndex = -1;
				ctx.activeOptionId = '';
				ctx.rows = [];
			}

			if ( row.type === 'query' ) {
				state.searchQuery = row.text;
				actions.search();
				return;
			}

			if ( row.type === 'taxonomy' ) {
				const filterConfig = state.filterConfigs?.[ row.taxonomy ];
				if ( row.taxonomy && row.slug && filterConfig?.filterType === 'taxonomy' ) {
					actions.setFilter( row.taxonomy, row.slug );
					return;
				}
			}

			if ( row.url ) {
				window.location.href = row.url;
			}
		},

		/**
		 * Fetch suggestions for a specific input. Generator action so the
		 * Interactivity API can `await` the fetch; aborts any prior request
		 * for the same input before starting a new one.
		 *
		 * The context proxy is passed in (rather than read via `getContext()`)
		 * because this action is dispatched from a `setTimeout` callback,
		 * where Interactivity's context tracking is no longer live.
		 *
		 * @param {HTMLInputElement} input - The input whose query to fetch for.
		 * @param {object}           ctx   - The per-instance context proxy to mutate.
		 * @yield {Promise<Array>} Suggestions fetch promise.
		 */
		*fetchSuggestionsFor( input, ctx ) {
			if ( ! ctx ) {
				return;
			}
			const { state } = store( NAMESPACE );
			const query = state.searchQuery;
			const siteId = state.siteId;
			// The block can be rendered on a site that doesn't have a
			// configured Jetpack Search site id — gracefully degrade to
			// "no suggestions" rather than firing a doomed request.
			if ( ! query || ! siteId ) {
				ctx.rows = [];
				ctx.showSuggestions = false;
				ctx.activeIndex = -1;
				ctx.activeOptionId = '';
				return;
			}

			const prior = suggestionAborts.get( input );
			if ( prior ) {
				prior.abort();
			}
			const controller = new AbortController();
			suggestionAborts.set( input, controller );

			let suggestions = [];
			try {
				suggestions = yield fetchSuggestions( {
					query,
					siteId,
					isPrivateSite: !! state.isPrivateSite,
					isWpcom: !! state.isWpcom,
					homeUrl: state.homeUrl ?? '',
					nonce: state.nonce ?? '',
					signal: controller.signal,
				} );
			} catch ( err ) {
				// AbortError is the expected outcome when typing fast — every
				// keystroke aborts the prior fetch — so we don't surface it
				// as an error. Any other failure also degrades silently:
				// suggestions are an enhancement, not a critical path.
				if ( err?.name !== 'AbortError' ) {
					suggestions = [];
				} else {
					return;
				}
			} finally {
				// Only clear the abort slot if it's still pointing at this
				// controller — a newer keystroke may have replaced it.
				if ( suggestionAborts.get( input ) === controller ) {
					suggestionAborts.delete( input );
				}
			}

			const rows = buildSuggestionRows( suggestions, ctx.listboxId, {
				query: state.strings?.suggestionLabelQuery ?? '',
				taxonomy: state.strings?.suggestionLabelTaxonomy ?? '',
				post: state.strings?.suggestionLabelPost ?? '',
			} );
			ctx.rows = rows;
			ctx.activeIndex = -1;
			ctx.activeOptionId = '';
			// Only auto-open if the input is still focused; otherwise let
			// the next focus event reveal the dropdown to avoid flashing it
			// after the user has already tabbed away.
			ctx.showSuggestions = rows.length > 0 && input.ownerDocument.activeElement === input;
		},

		/**
		 * Clear the current search query and re-run search.
		 *
		 * @yield {Promise} search action.
		 */
		*clearSearch() {
			const { state, actions } = store( NAMESPACE );
			state.searchQuery = '';
			// Closing the dropdown on the originating wrapper. `getContext()`
			// resolves to the wrapper that owns the clicked clear button.
			const ctx = getContext();
			if ( ctx ) {
				ctx.rows = [];
				ctx.showSuggestions = false;
				ctx.activeIndex = -1;
				ctx.activeOptionId = '';
			}
			yield actions.search();
		},
	},
} );
