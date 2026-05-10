import { store, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the min and max range inputs sharing a wrapper with `el`.
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
 * Coerce an input's `.value` to a numeric bound (mirrors `parsePriceBound`
 * in url-state.js so the slider and URL reader agree on "no bound").
 *
 * @param {string|null|undefined} raw - Input value.
 * @return {number|null} Parsed bound or null for empty / NaN / negative.
 */
function parseBound( raw ) {
	if ( raw === null || raw === undefined || raw === '' ) {
		return null;
	}
	const num = Number( raw );
	return Number.isFinite( num ) && num >= 0 ? num : null;
}

/**
 * Pin the parsed pair so `min <= max` — native range inputs let a user drag
 * past their sibling.
 *
 * @param {HTMLInputElement|null} minEl - Min slider element.
 * @param {HTMLInputElement|null} maxEl - Max slider element.
 * @return {{min: number|null, max: number|null}} Clamped, parsed bounds.
 */
function clampPair( minEl, maxEl ) {
	let minVal = parseBound( minEl?.value );
	let maxVal = parseBound( maxEl?.value );
	if ( minVal !== null && maxVal !== null && minVal > maxVal ) {
		// Snap the side that just moved (whichever input has focus) — clamping
		// the stationary thumb instead would drag both thumbs together.
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
 * Format a numeric bound for the screen-reader `aria-valuetext` as a rounded
 * integer with the currency symbol — drops sub-unit precision so a few-pixel
 * drag doesn't churn "$24.96 / $25.04 / $25.12" announcements.
 *
 * @param {number|null|undefined} value    - Numeric bound.
 * @param {string}                symbol   - Currency symbol (≤ 2 chars).
 * @param {'left'|'right'}        position - Symbol position.
 * @return {string} Formatted label, e.g. "$25" or "25 kr".
 */
function formatBoundLabel( value, symbol, position ) {
	if ( value === null || value === undefined || ! Number.isFinite( value ) ) {
		return '';
	}
	const rounded = String( Math.round( value ) );
	return position === 'right' ? `${ rounded }${ symbol }` : `${ symbol }${ rounded }`;
}

/**
 * Resolve the slider's two number-input fields (sitting below the track) from
 * the input that fired the event. Mirrors `findSliderInputs` but for the
 * `__number-input` pair, not the range thumbs.
 *
 * @param {HTMLElement} el - The input that fired the event.
 * @return {{min: HTMLInputElement|null, max: HTMLInputElement|null}} Number inputs.
 */
function findNumberInputs( el ) {
	const wrapper = el?.closest?.( '.jetpack-search-filter-wc-price-slider' );
	if ( ! wrapper ) {
		return { min: null, max: null };
	}
	return {
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__number-input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__number-input--max' ),
	};
}

/**
 * Read the slider's track bounds from the input elements' `min` / `max` HTML
 * attributes. These describe the store's full catalogue range (server-rendered
 * by render.php) and stay fixed for the page's lifetime — applying other
 * filters narrows the result set but does not shrink the slider, mirroring WC.
 *
 * @param {HTMLElement|null} wrapper - Slider wrapper element.
 * @return {{sliderMin: number, sliderMax: number}} Track bounds.
 */
function readSliderBounds( wrapper ) {
	const minEl = wrapper?.querySelector?.( '.jetpack-search-filter-wc-price-slider__input--min' );
	const maxEl = wrapper?.querySelector?.( '.jetpack-search-filter-wc-price-slider__input--max' );
	return {
		sliderMin: Number( minEl?.min ) || 0,
		sliderMax: Number( maxEl?.max ) || 100,
	};
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--value` for the number-input below the slider. Returns
		 * an empty string when no bound is set so the input renders blank
		 * rather than "null". Mirrors the getter the inputs-only price block
		 * exposes — defined here too so the slider is self-contained when
		 * inserted without the sibling block. The Interactivity API merges
		 * duplicate getter definitions; same body, no conflict.
		 *
		 * @return {string} Min value as a string for the input.
		 */
		get priceRangeMinInputValue() {
			const { state } = store( NAMESPACE );
			const min = state.priceRange?.min;
			return min === null || min === undefined ? '' : String( min );
		},

		/**
		 * Companion getter for the max number-input. Same null-safe pattern as
		 * `priceRangeMinInputValue`.
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
		 * Live drag handler. `input` fires ~60×/s while the user drags;
		 * we update `state.priceRange` so the watcher repaints the fill and
		 * labels, but defer the search to `onPriceSliderChange` (release).
		 */
		onPriceSliderInput() {
			const el = getElement()?.ref;
			const { min, max } = findSliderInputs( el );
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
		 * Release handler (`change` event). Commits the current bounds via
		 * `setPriceRange`. That action searches internally only when state
		 * actually changes; the drag path pre-wrote state, so it no-ops and
		 * we trigger an explicit search. Capture `willNoOp` _before_ calling
		 * `setPriceRange` — afterwards `state.priceRange` always matches
		 * `bounds`, masking whether a write happened. This avoids the
		 * double-search keyboard-only changes would otherwise produce.
		 *
		 * @yield {Promise} setPriceRange / search action.
		 */
		*onPriceSliderChange() {
			const el = getElement()?.ref;
			const { min, max } = findSliderInputs( el );
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

		/**
		 * Commit handler for the number inputs below the slider. Reads both
		 * sibling inputs from the DOM rather than tracking each value in store
		 * state so user typing isn't published until they actually commit
		 * (blur / Enter / native `change`). The watcher then writes the new
		 * `state.priceRange` back into the range thumbs.
		 *
		 * @yield {Promise} setPriceRange action.
		 */
		*onPriceSliderNumberInputChange() {
			const el = getElement()?.ref;
			const { min, max } = findNumberInputs( el );
			yield store( NAMESPACE ).actions.setPriceRange(
				parseBound( min?.value ),
				parseBound( max?.value )
			);
		},

		/**
		 * Submit-on-Enter for the number inputs. Blurs the field so the
		 * native `change` event fires and `onPriceSliderNumberInputChange`
		 * commits — without waiting for the user to tab away.
		 *
		 * @param {KeyboardEvent} event - Keydown event.
		 */
		onPriceSliderNumberInputKeydown( event ) {
			if ( event?.key !== 'Enter' ) {
				return;
			}
			event.preventDefault();
			event.target?.blur?.();
		},
	},

	callbacks: {
		/**
		 * Reactive watcher attached via `data-wp-watch`. Re-runs on every
		 * `state.priceRange` change to update the `--low` / `--high` track
		 * gradient, sync the range thumbs, and refresh `aria-valuetext`. The
		 * number inputs below the slider sync automatically via their
		 * `data-wp-bind--value` getter — no manual write needed here.
		 */
		updatePriceSliderUi() {
			const wrapper = getElement()?.ref;
			if ( ! wrapper ) {
				return;
			}
			const range = wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__range' );
			const minInput = wrapper.querySelector(
				'.jetpack-search-filter-wc-price-slider__input--min'
			);
			const maxInput = wrapper.querySelector(
				'.jetpack-search-filter-wc-price-slider__input--max'
			);
			const { state } = store( NAMESPACE );
			const { sliderMin, sliderMax } = readSliderBounds( wrapper );
			const priceRange = state.priceRange;
			// Clamp to slider bounds — a deep-linked URL can carry an
			// out-of-range `min_price` / `max_price`, in which case the native
			// range input clamps its `.value` but aria-valuetext would still
			// announce the unclamped figure.
			const clamp = v => Math.min( sliderMax, Math.max( sliderMin, Number( v ) ) );
			const minVal = priceRange?.min != null ? clamp( priceRange.min ) : sliderMin;
			const maxVal = priceRange?.max != null ? clamp( priceRange.max ) : sliderMax;
			const symbol = state.priceCurrencySymbol || '';
			const position = state.priceCurrencySymbolPosition || 'left';

			// Skip the actively-dragged input — overwriting its own value
			// mid-drag would jitter the thumb against the user's pointer.
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

			if ( range ) {
				const span = sliderMax - sliderMin;
				if ( ! Number.isFinite( span ) || span <= 0 ) {
					range.style.setProperty( '--low', '0%' );
					range.style.setProperty( '--high', '100%' );
				} else {
					const low = Math.max( 0, Math.min( 100, ( ( minVal - sliderMin ) / span ) * 100 ) );
					const high = Math.max( 0, Math.min( 100, ( ( maxVal - sliderMin ) / span ) * 100 ) );
					range.style.setProperty( '--low', `${ low }%` );
					range.style.setProperty( '--high', `${ high }%` );
				}
			}

			// `aria-valuetext` gives screen readers a currency-formatted
			// announcement ("$25") instead of the raw numeric value.
			if ( minInput ) {
				minInput.setAttribute( 'aria-valuetext', formatBoundLabel( minVal, symbol, position ) );
			}
			if ( maxInput ) {
				maxInput.setAttribute( 'aria-valuetext', formatBoundLabel( maxVal, symbol, position ) );
			}
		},
	},
} );
