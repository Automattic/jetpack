/**
 * Autocomplete-suggestions surface for the Search Input block.
 *
 * Everything that's specific to the suggestions dropdown — the per-input
 * debounce / abort WeakMaps, the focus / blur / click handlers, the
 * `data-wp-each` row-active getter, the WPCOM fetch generator action, and
 * the `acceptSuggestion` dispatcher — lives here. The block's own
 * `view.js` only knows about typing and clearing; it delegates the
 * suggestion-specific work to the three helpers exported below.
 *
 * The actions registered by the side-effect `store()` call at the bottom of
 * the file are merged into the shared `jetpack-search` Interactivity store
 * alongside the actions registered from `view.js`. Interactivity composes
 * `store()` calls on the same namespace by key, so as long as the two files
 * register disjoint keys (this file owns the suggestions-only ones; view.js
 * owns the input-only ones) there's no cross-file mutable state.
 */

import { getContext, store } from '@wordpress/interactivity';
import { fetchSuggestions } from '../../store/suggestions-api';
import { buildSuggestionRows, countOptions, rowAtOptionIndex } from './suggestion-rows';

const NAMESPACE = 'jetpack-search';
const SUGGESTIONS_DEBOUNCE_MS = 120;
const SUGGESTIONS_BLUR_CLOSE_MS = 150;

// Per-input timer / abort state. WeakMaps keyed by the input element itself
// so two `search-input` blocks on the same page (header + sidebar) don't
// reset each other's timers or abort each other's suggestions request, and
// so GC can reclaim the entries automatically when an input leaves the DOM.
const suggestionTimers = new WeakMap();
const suggestionAborts = new WeakMap();
const blurTimers = new WeakMap();

/**
 * Whether a particular search input opted into suggestions. The block
 * author's `enableSuggestions` attribute renders the `data-suggestions-enabled`
 * attribute server-side; this is the single source of truth the suggestions
 * layer consults at every entry point so non-opted-in inputs cost nothing.
 *
 * @param {HTMLInputElement} input - The input to check.
 * @return {boolean} True when this input is suggestions-enabled.
 */
function isSuggestionsInput( input ) {
	return input?.dataset?.suggestionsEnabled === 'true';
}

/**
 * Schedule (or restart) the debounced suggestions fetch for a single
 * input. Faster than the search debounce so the dropdown feels responsive —
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
		store( NAMESPACE ).actions.fetchSuggestionsFor( input, ctx );
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

/**
 * Schedule a suggestions fetch on a fresh keystroke. No-op when the input
 * isn't suggestions-enabled, so `view.js`'s `onSearchInput` can call it
 * unconditionally without branching on the attribute.
 *
 * @param {HTMLInputElement} input - The input that received the keystroke.
 */
export function handleInputForSuggestions( input ) {
	if ( ! isSuggestionsInput( input ) ) {
		return;
	}
	scheduleSuggestions( input, getContext() );
}

/**
 * Route ArrowUp / ArrowDown / Escape / Enter for suggestions-enabled
 * inputs. Returns `true` when the keystroke was consumed by the
 * suggestions layer (caller should NOT run the default search action),
 * `false` otherwise (caller proceeds with its usual Enter-fires-search
 * behavior). Non-suggestions inputs always get `false` so the keyboard
 * path in `view.js`'s `onSearchKeydown` is uniform.
 *
 * @param {KeyboardEvent}    event - The keydown event from `view.js`.
 * @param {HTMLInputElement} input - `event.target`, threaded through so callers don't repeat the lookup.
 * @return {boolean} True if the suggestions layer claimed the keystroke.
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
			// No row was highlighted — close the dropdown but let `view.js`
			// fire the actual search via its own Enter path.
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
			store( NAMESPACE ).actions.acceptSuggestion( row );
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
			// dispatched from either the input's keydown handler (wrapper
			// scope) or the suggestion `<li>`'s click handler (row scope
			// nested under the same wrapper). The Interactivity API merges
			// the `data-wp-each` row entries onto the wrapper's context, and
			// writes to keys that exist on the wrapper proxy (`showSuggestions`,
			// `activeIndex`, `activeOptionId`, `rows`) propagate up through
			// the same reactive signal — verified empirically by clicking a
			// suggestion row and watching the dropdown close. Only writes to
			// `ctx.row` itself would be absorbed by the each scope.
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
	},
} );
