import { store, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the min and max input elements that share a parent block
 * wrapper with `el`. Used by the change handler to read both values when
 * either input changes (the store action takes both bounds together).
 *
 * @param {HTMLElement} el - The input that fired the event.
 * @return {{min: HTMLInputElement|null, max: HTMLInputElement|null}} Sibling inputs.
 */
function findRangeInputs( el ) {
	const wrapper = el?.closest?.( '.jetpack-search-filter-wc-price' );
	if ( ! wrapper ) {
		return { min: null, max: null };
	}
	return {
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--max' ),
	};
}

/**
 * Coerce an input's `.value` string into the shape the store action
 * expects: an empty input → null, a numeric input → its Number, anything
 * else → null (the store action drops invalid bounds anyway, but
 * normalizing here avoids a redundant search-token bump).
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

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--value` for the min input. Returns an empty string
		 * when no bound is set so the input renders blank rather than
		 * "null". `data-wp-bind` only evaluates simple property paths, so
		 * the null-safe lookup needs to live in a getter.
		 *
		 * @return {string} Min value as a string for the input.
		 */
		get priceRangeMinInputValue() {
			const { state } = store( NAMESPACE );
			const min = state.priceRange?.min;
			return min === null || min === undefined ? '' : String( min );
		},

		/**
		 * `data-wp-bind--value` for the max input. Same null-safe pattern
		 * as `priceRangeMinInputValue`.
		 *
		 * @return {string} Max value as a string for the input.
		 */
		get priceRangeMaxInputValue() {
			const { state } = store( NAMESPACE );
			const max = state.priceRange?.max;
			return max === null || max === undefined ? '' : String( max );
		},
	},

	actions: {
		/**
		 * Apply both bounds to the store. Reads the sibling inputs from
		 * the DOM rather than tracking each input's value in store state
		 * so user typing isn't published to other listeners until they
		 * actually commit a change (blur / Enter / native `change` event).
		 *
		 * The native `change` event on `<input type="number">` fires on
		 * blur and on Enter, so this handler doubles as the submit path.
		 *
		 * @yield {Promise} setPriceRange action.
		 */
		*onPriceRangeInputChange() {
			const el = getElement()?.ref;
			const { min, max } = findRangeInputs( el );
			yield store( NAMESPACE ).actions.setPriceRange(
				parseBound( min?.value ),
				parseBound( max?.value )
			);
		},

		/**
		 * Submit-on-Enter without waiting for blur, so a one-handed
		 * keyboard flow (type → Enter) commits immediately. Also blurs
		 * the input so screen-reader focus moves predictably to the next
		 * page region instead of staying inside a now-stale field value.
		 *
		 * @param {KeyboardEvent} event - Keydown event.
		 */
		onPriceRangeInputKeydown( event ) {
			if ( event?.key !== 'Enter' ) {
				return;
			}
			event.preventDefault();
			event.target?.blur?.();
		},
	},
} );
