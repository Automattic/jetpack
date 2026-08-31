/**
 * Autocomplete-suggestions surface for search-input. Owns the per-input
 * debounce/abort WeakMaps, focus/blur/click handlers, the row-active getter,
 * the fetch action, and `acceptSuggestion`. view.js stays focused on typing
 * + clearing. Composes into the shared store via disjoint action keys.
 */

import { getContext, store } from '@wordpress/interactivity';
import { fetchSuggestions } from '../../store/suggestions-api';
import { buildSuggestionRows, countOptions, rowAtOptionIndex } from './suggestion-rows';

const NAMESPACE = 'jetpack-search';
const SUGGESTIONS_DEBOUNCE_MS = 120;
const SUGGESTIONS_BLUR_CLOSE_MS = 150;

// Per-input state keyed on the element so two inputs (header + sidebar)
// don't reset each other; WeakMaps let GC reclaim on DOM removal.
const suggestionTimers = new WeakMap();
const suggestionAborts = new WeakMap();
const blurTimers = new WeakMap();

/**
 * Did this input opt into suggestions. Cheap gate so non-opted-in inputs
 * cost nothing — every entry point checks it.
 *
 * @param {HTMLInputElement} input - The input.
 * @return {boolean} True when suggestions-enabled.
 */
function isSuggestionsInput( input ) {
	return input?.dataset?.suggestionsEnabled === 'true';
}

/**
 * Schedule/restart the debounced suggestions fetch (120 ms — faster than
 * the search debounce so the dropdown stays snappy). Caller passes `ctx`
 * because `getContext()` from inside `setTimeout` returns null (context
 * tracking is only live inside the originating handler).
 *
 * @param {HTMLInputElement} input - The input.
 * @param {object}           ctx   - Per-instance context proxy to mutate when the fetch lands.
 */
function scheduleSuggestions( input, ctx ) {
	clearTimeout( suggestionTimers.get( input ) );
	const timer = setTimeout( () => {
		suggestionTimers.delete( input );
		store( NAMESPACE ).actions.fetchSuggestionsFor( input, ctx );
	}, SUGGESTIONS_DEBOUNCE_MS );
	suggestionTimers.set( input, timer );
}

/**
 * Cancel any pending debounce + abort any in-flight request.
 *
 * @param {HTMLInputElement} input - The input.
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

/**
 * Schedule a suggestions fetch on a keystroke. No-op when the input
 * isn't suggestions-enabled so view.js can call unconditionally.
 *
 * @param {HTMLInputElement} input - The input.
 */
export function handleInputForSuggestions( input ) {
	if ( ! isSuggestionsInput( input ) ) {
		return;
	}
	scheduleSuggestions( input, getContext() );
}

/**
 * Route Arrow/Escape/Enter for suggestions-enabled inputs. Returns true
 * when consumed (caller skips default Enter→search), false otherwise.
 *
 * @param {KeyboardEvent}    event - Keydown event.
 * @param {HTMLInputElement} input - Event target.
 * @return {boolean} True when consumed.
 */
export function handleKeydownForSuggestions( event, input ) {
	if ( ! isSuggestionsInput( input ) ) {
		return false;
	}
	const ctx = getContext();
	const rows = ctx?.rows ?? [];
	const optionCount = countOptions( rows );

	switch ( event.key ) {
		case 'ArrowDown':
			event.preventDefault();
			if ( optionCount === 0 ) {
				return true;
			}
			ctx.showSuggestions = true;
			ctx.activeIndex = ctx.activeIndex < optionCount - 1 ? ctx.activeIndex + 1 : ctx.activeIndex;
			ctx.activeOptionId = rowAtOptionIndex( rows, ctx.activeIndex )?.optionId ?? '';
			return true;
		case 'ArrowUp':
			event.preventDefault();
			if ( optionCount === 0 ) {
				return true;
			}
			ctx.activeIndex = ctx.activeIndex > 0 ? ctx.activeIndex - 1 : -1;
			ctx.activeOptionId = rowAtOptionIndex( rows, ctx.activeIndex )?.optionId ?? '';
			return true;
		case 'Escape':
			ctx.showSuggestions = false;
			ctx.activeIndex = -1;
			ctx.activeOptionId = '';
			return true;
		case 'Enter': {
			if ( ctx.showSuggestions && ctx.activeIndex >= 0 ) {
				const row = rowAtOptionIndex( rows, ctx.activeIndex );
				if ( row ) {
					event.preventDefault();
					cancelPendingSuggestions( input );
					store( NAMESPACE ).actions.acceptSuggestion( row );
					return true;
				}
			}
			// No row highlighted — close the dropdown; view.js fires the search.
			ctx.showSuggestions = false;
			ctx.activeIndex = -1;
			ctx.activeOptionId = '';
			cancelPendingSuggestions( input );
			return false;
		}
		default:
			return false;
	}
}

/**
 * Reset the suggestion-side per-instance state. Called from `view.js`'s
 * `clearSearch` so a cleared input also empties any open dropdown. Safe
 * for non-suggestions blocks: when no `data-wp-context` is in scope the
 * proxy resolves to an empty object and the writes are no-ops.
 */
export function clearSuggestionsContext() {
	const ctx = getContext();
	if ( ! ctx ) {
		return;
	}
	ctx.rows = [];
	ctx.showSuggestions = false;
	ctx.activeIndex = -1;
	ctx.activeOptionId = '';
}

// Side-effect: register the suggestions-only slice on the shared
// `jetpack-search` Interactivity store. Interactivity composes slices
// across `store()` calls on the same namespace by key, so this co-exists
// with the slice registered by `view.js` without sharing mutable state.
store( NAMESPACE, {
	state: {
		/**
		 * Whether the current `data-wp-each` row is the keyboard-highlighted
		 * option. Encapsulates the `optionIndex === activeIndex` comparison
		 * (data-wp-bind only takes simple paths).
		 *
		 * @return {boolean} True when active.
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
		onSearchFocus( event ) {
			// Only reopen if there are rows — otherwise we'd flash an empty `<ul>`.
			const ctx = getContext();
			const input = event.target;
			clearTimeout( blurTimers.get( input ) );
			blurTimers.delete( input );
			if ( ctx?.rows?.length > 0 ) {
				ctx.showSuggestions = true;
			}
		},

		onSearchBlur( event ) {
			// 150 ms grace so a click on a row fires before the dropdown closes.
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
			// Prevent the blur that would close the dropdown before the click fires.
			event.preventDefault();
		},

		onSuggestionClick() {
			const ctx = getContext();
			const row = ctx?.row;
			if ( ! row || row.isHeader ) {
				return;
			}
			store( NAMESPACE ).actions.acceptSuggestion( row );
		},

		/**
		 * Apply a selected row: `query` fills + searches; `taxonomy` applies
		 * as an inline filter when one's registered, else navigates;
		 * `post` navigates.
		 *
		 * @param {object} row - Selected row.
		 */
		acceptSuggestion( row ) {
			const { state, actions } = store( NAMESPACE );

			// Close the dropdown. Writes to wrapper-context keys propagate up
			// through the merged reactive signal; only `ctx.row` would be
			// absorbed by the `data-wp-each` scope.
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
		 * Fetch suggestions for a specific input; aborts prior in-flight. `ctx`
		 * passed in because `getContext()` isn't live inside the `setTimeout` caller.
		 *
		 * @param {HTMLInputElement} input - The input.
		 * @param {object}           ctx   - Per-instance context proxy.
		 * @yield {Promise<Array>} Suggestions fetch.
		 */
		*fetchSuggestionsFor( input, ctx ) {
			if ( ! ctx ) {
				return;
			}
			const { state } = store( NAMESPACE );
			const query = state.searchQuery;
			const siteId = state.siteId;
			// Degrade silently on sites without a Jetpack Search site id.
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

			let suggestions;
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
				// AbortError is expected — fast typing. Other failures degrade silently.
				if ( err?.name !== 'AbortError' ) {
					suggestions = [];
				} else {
					return;
				}
			} finally {
				// Only clear our own slot — a newer keystroke may have replaced it.
				if ( suggestionAborts.get( input ) === controller ) {
					suggestionAborts.delete( input );
				}
			}

			const rows = buildSuggestionRows(
				suggestions,
				ctx.listboxId,
				{
					query: state.strings?.suggestionLabelQuery ?? '',
					taxonomy: state.strings?.suggestionLabelTaxonomy ?? '',
					post: state.strings?.suggestionLabelPost ?? '',
				},
				// Non-array falls through to "all enabled" for older saved blocks.
				ctx.suggestionTypes
			);
			ctx.rows = rows;
			ctx.activeIndex = -1;
			ctx.activeOptionId = '';
			// Auto-open only if still focused — don't flash after user tabbed away.
			ctx.showSuggestions = rows.length > 0 && input.ownerDocument.activeElement === input;
		},
	},
} );
