import { store, getElement } from '@wordpress/interactivity';
import 'jetpack-search/store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Min/max number inputs sharing `el`'s wrapper. Same lookup serves both
 * the inputs-only layout and the slider variant (number inputs share BEM).
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
 * Slider range thumbs sharing `el`'s wrapper. Separate classes from
 * `findRangeInputs` so number inputs and slider thumbs don't shadow each other.
 *
 * @param {HTMLElement} el - The input that fired the event.
 * @return {{min: HTMLInputElement|null, max: HTMLInputElement|null}} Slider thumbs.
 */
function findSliderThumbs( el ) {
	const wrapper = el?.closest?.( '.jetpack-search-filter-wc-price' );
	if ( ! wrapper ) {
		return { min: null, max: null };
	}
	return {
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price__slider-input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price__slider-input--max' ),
	};
}

/**
 * Coerce an input value to the store action's shape. Mirrors
 * `parsePriceBound` in `url-state.js`. Empty → null; non-numeric/negative → null.
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
 * Pin `min <= max` — native range inputs allow dragging past the sibling.
 * Snaps the side that just moved (focused) so the stationary thumb stays put.
 *
 * @param {HTMLInputElement|null} minEl - Min slider thumb.
 * @param {HTMLInputElement|null} maxEl - Max slider thumb.
 * @return {{min: number|null, max: number|null}} Clamped, parsed bounds.
 */
function clampPair( minEl, maxEl ) {
	let minVal = parseBound( minEl?.value );
	let maxVal = parseBound( maxEl?.value );
	if ( minVal !== null && maxVal !== null && minVal > maxVal ) {
		const ownerDoc = ( minEl ?? maxEl )?.ownerDocument;
		if ( ownerDoc && ownerDoc.activeElement === maxEl ) {
			maxVal = minVal;
			if ( maxEl ) {
				maxEl.value = String( minVal );
			}
		} else {
			minVal = maxVal;
			if ( minEl ) {
				minEl.value = String( maxVal );
			}
		}
	}
	return { min: minVal, max: maxVal };
}

/**
 * `aria-valuetext` label — rounded integer + symbol. Drops sub-unit precision
 * so a few-pixel drag doesn't churn announcements.
 *
 * @param {number|null|undefined} value    - Numeric bound.
 * @param {string}                symbol   - Currency symbol.
 * @param {'left'|'right'}        position - Symbol position.
 * @return {string} Formatted label.
 */
function formatBoundLabel( value, symbol, position ) {
	if ( value === null || value === undefined || ! Number.isFinite( value ) ) {
		return '';
	}
	const rounded = String( Math.round( value ) );
	return position === 'right' ? `${ rounded }${ symbol }` : `${ symbol }${ rounded }`;
}

/**
 * Track bounds from the slider's `min`/`max` attrs (server-rendered, fixed for
 * page life — matches WC).
 *
 * @param {HTMLElement|null} wrapper - Block wrapper.
 * @return {{sliderMin: number, sliderMax: number}} Track bounds.
 */
function readSliderBounds( wrapper ) {
	const minEl = wrapper?.querySelector?.( '.jetpack-search-filter-wc-price__slider-input--min' );
	const maxEl = wrapper?.querySelector?.( '.jetpack-search-filter-wc-price__slider-input--max' );
	return {
		sliderMin: Number( minEl?.min ) || 0,
		sliderMax: Number( maxEl?.max ) || 100,
	};
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--value` for min input — empty (not "null") when unset.
		 *
		 * @return {string} Min value as a string.
		 */
		get priceRangeMinInputValue() {
			const { state } = store( NAMESPACE );
			const min = state.priceRange?.min;
			return min === null || min === undefined ? '' : String( min );
		},

		/**
		 * `data-wp-bind--value` for max input.
		 *
		 * @return {string} Max value as a string.
		 */
		get priceRangeMaxInputValue() {
			const { state } = store( NAMESPACE );
			const max = state.priceRange?.max;
			return max === null || max === undefined ? '' : String( max );
		},
	},

	actions: {
		/**
		 * Commit handler for the number inputs. Reads both sibling inputs
		 * from the DOM rather than tracking each value in store state so
		 * user typing isn't published until they actually commit (blur /
		 * Enter / native `change`). When the slider is also rendered, the
		 * watcher writes the new `state.priceRange` back into the range
		 * thumbs after this commits.
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
		 * Enter blurs to fire the native `change` and commit via
		 * `onPriceRangeInputChange`.
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

		/**
		 * Live drag handler. Updates state so the watcher repaints, but defers
		 * the search to `onPriceSliderChange` on release.
		 */
		onPriceSliderInput() {
			const el = getElement()?.ref;
			const { min, max } = findSliderThumbs( el );
			if ( ! min || ! max ) {
				return;
			}
			const bounds = clampPair( min, max );
			if ( bounds.min === null || bounds.max === null ) {
				return;
			}
			const { state } = store( NAMESPACE );
			const prev = state.priceRange;
			if ( prev && prev.min === bounds.min && prev.max === bounds.max ) {
				return;
			}
			state.priceRange = { min: bounds.min, max: bounds.max };
		},

		/**
		 * Release handler. `setPriceRange` only searches when state changes;
		 * the drag path pre-wrote state, so we have to trigger a search
		 * ourselves. Capture `willNoOp` BEFORE the action — afterwards state
		 * always matches `bounds` so the check is masked.
		 *
		 * @yield {Promise} setPriceRange / search action.
		 */
		*onPriceSliderChange() {
			const el = getElement()?.ref;
			const { min, max } = findSliderThumbs( el );
			if ( ! min || ! max ) {
				return;
			}
			const bounds = clampPair( min, max );
			const { state } = store( NAMESPACE );
			const willNoOp =
				state.priceRange &&
				state.priceRange.min === bounds.min &&
				state.priceRange.max === bounds.max;
			yield store( NAMESPACE ).actions.setPriceRange( bounds.min, bounds.max );
			if ( willNoOp ) {
				yield store( NAMESPACE ).actions.search();
			}
		},
	},

	callbacks: {
		/**
		 * Reactive `data-wp-watch` for slider mode — repaints the track
		 * gradient, syncs the thumbs, refreshes `aria-valuetext`. No-ops in
		 * filter-only mode (no slider DOM).
		 */
		updatePriceSliderUi() {
			const wrapper = getElement()?.ref;
			if ( ! wrapper ) {
				return;
			}
			const slider = wrapper.querySelector( '.jetpack-search-filter-wc-price__slider' );
			if ( ! slider ) {
				return;
			}
			const minInput = wrapper.querySelector(
				'.jetpack-search-filter-wc-price__slider-input--min'
			);
			const maxInput = wrapper.querySelector(
				'.jetpack-search-filter-wc-price__slider-input--max'
			);
			const { state } = store( NAMESPACE );
			const { sliderMin, sliderMax } = readSliderBounds( wrapper );
			const priceRange = state.priceRange;
			// Clamp deep-linked out-of-range bounds — native input clamps `.value`
			// but `aria-valuetext` would still announce the unclamped figure.
			const clamp = v => Math.min( sliderMax, Math.max( sliderMin, Number( v ) ) );
			const minVal = priceRange?.min != null ? clamp( priceRange.min ) : sliderMin;
			const maxVal = priceRange?.max != null ? clamp( priceRange.max ) : sliderMax;
			const symbol = state.priceCurrencySymbol || '';
			const position = state.priceCurrencySymbolPosition || 'left';

			// Skip the actively-dragged input — overwriting mid-drag jitters.
			const active = wrapper.ownerDocument?.activeElement;
			if ( minInput && minInput !== active ) {
				const next = String( minVal );
				if ( minInput.value !== next ) {
					minInput.value = next;
				}
			}
			if ( maxInput && maxInput !== active ) {
				const next = String( maxVal );
				if ( maxInput.value !== next ) {
					maxInput.value = next;
				}
			}

			const span = sliderMax - sliderMin;
			if ( ! Number.isFinite( span ) || span <= 0 ) {
				slider.style.setProperty( '--low', '0%' );
				slider.style.setProperty( '--high', '100%' );
			} else {
				const low = Math.max( 0, Math.min( 100, ( ( minVal - sliderMin ) / span ) * 100 ) );
				const high = Math.max( 0, Math.min( 100, ( ( maxVal - sliderMin ) / span ) * 100 ) );
				slider.style.setProperty( '--low', `${ low }%` );
				slider.style.setProperty( '--high', `${ high }%` );
			}

			// `aria-valuetext` for currency-formatted SR announcement.
			if ( minInput ) {
				minInput.setAttribute( 'aria-valuetext', formatBoundLabel( minVal, symbol, position ) );
			}
			if ( maxInput ) {
				maxInput.setAttribute( 'aria-valuetext', formatBoundLabel( maxVal, symbol, position ) );
			}
		},
	},
} );
