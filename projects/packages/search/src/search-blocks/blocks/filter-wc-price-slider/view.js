import { store, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

// Debounce window for setPriceRange dispatches. `<input type="range">` fires
// `input` continuously while dragging — at 60fps that's ~60 events/second. The
// shared `actions.setPriceRange` action triggers a search, so without a wait
// the user would burn the search-token counter on every pixel of drag. 300ms
// is long enough that hold-and-drag coalesces into a single search yet short
// enough that release feels instant.
export const DEBOUNCE_MS = 300;

let pendingTimer = null;

/**
 * Resolve the min and max range inputs that share a parent block wrapper with
 * `el`. Used by the input handler to read both bounds when either thumb moves
 * (the store action takes both bounds together).
 *
 * @param {HTMLElement} el - The input that fired the event.
 * @return {{min: HTMLInputElement|null, max: HTMLInputElement|null}} Sibling inputs.
 */
function findSliderInputs( el ) {
	const wrapper = el?.closest?.( '.jetpack-search-filter-wc-price-slider' );
	if ( ! wrapper ) {
		return { min: null, max: null };
	}
	return {
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--max' ),
	};
}

/**
 * Coerce an input's `.value` string into the shape the store action expects:
 * empty → null, numeric → its Number, anything else → null. Mirrors the
 * existing number-input price block so both blocks treat "no bound" identically.
 *
 * @param {string|null|undefined} raw - Input value.
 * @return {number|null} Parsed bound or null.
 */
function parseBound( raw ) {
	if ( raw === null || raw === undefined || raw === '' ) {
		return null;
	}
	const num = Number( raw );
	return Number.isFinite( num ) && num >= 0 ? num : null;
}

/**
 * Clamp the min/max pair so a user can't drag the lower thumb past the upper
 * one. Mutates the lower DOM input's value to match the upper value when they
 * cross — the store-side guard would silently drop an inverted range, so this
 * keeps the visible thumb in sync with the dispatched bounds.
 *
 * @param {HTMLInputElement|null} minEl - Min slider element.
 * @param {HTMLInputElement|null} maxEl - Max slider element.
 * @return {{min: number|null, max: number|null}} Clamped, parsed bounds.
 */
function clampPair( minEl, maxEl ) {
	let minVal = parseBound( minEl?.value );
	const maxVal = parseBound( maxEl?.value );
	if ( minVal !== null && maxVal !== null && minVal > maxVal ) {
		minVal = maxVal;
		if ( minEl ) {
			minEl.value = String( maxVal );
		}
	}
	return { min: minVal, max: maxVal };
}

/**
 * Drive an Interactivity API generator action to completion. The runtime
 * auto-drives generators reached via `data-wp-on--*`, but a debounced dispatch
 * runs in a `setTimeout` callback — outside that loop — so the iterator has to
 * be advanced by hand. Mirrors the `runGenerator` test helper pattern.
 *
 * @param {Generator} generator - Action generator.
 * @return {Promise<*>} Final return value.
 */
async function runGenerator( generator ) {
	let step = generator.next();
	while ( ! step.done ) {
		try {
			step = generator.next( await step.value );
		} catch ( err ) {
			step = generator.throw( err );
		}
	}
	return step.value;
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--value` for the min slider. Returns the current
		 * `priceRange.min` as a string, or empty when no bound is set so the
		 * input falls back to its static `value` attribute (seeded by render.php
		 * to the slider's lower bound).
		 *
		 * @return {string} Min value as a string.
		 */
		get priceSliderMinValue() {
			const { state } = store( NAMESPACE );
			const min = state.priceRange?.min;
			return min === null || min === undefined ? '' : String( min );
		},

		/**
		 * `data-wp-bind--value` for the max slider. Same null-safe pattern as
		 * `priceSliderMinValue`.
		 *
		 * @return {string} Max value as a string.
		 */
		get priceSliderMaxValue() {
			const { state } = store( NAMESPACE );
			const max = state.priceRange?.max;
			return max === null || max === undefined ? '' : String( max );
		},
	},

	actions: {
		/**
		 * Coalesce slider drag events into a single setPriceRange call. Native
		 * `<input type="range">` fires `input` continuously while dragging and
		 * `change` on release — both wire here, both reset the same pending
		 * timer, so a drag-then-release commits exactly one search after the
		 * debounce window.
		 *
		 * Reads sibling inputs from the DOM rather than tracking each thumb's
		 * value in store state so user-drag interim values aren't published to
		 * other listeners until they actually commit (timer fires).
		 */
		onPriceSliderInput() {
			const el = getElement()?.ref;
			const { min, max } = findSliderInputs( el );
			if ( pendingTimer !== null ) {
				clearTimeout( pendingTimer );
			}
			pendingTimer = setTimeout( () => {
				pendingTimer = null;
				const bounds = clampPair( min, max );
				runGenerator( store( NAMESPACE ).actions.setPriceRange( bounds.min, bounds.max ) );
			}, DEBOUNCE_MS );
		},
	},
} );
