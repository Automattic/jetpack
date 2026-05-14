import { store, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the min / max number-input fields that share a wrapper with `el`.
 * The slider variant adds a slider track above these inputs but the number
 * inputs themselves share the same BEM block + wrapper class, so the same
 * lookup serves both layouts.
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
 * Resolve the slider's two range thumbs (`<input type="range">`) that share
 * the wrapper with `el`. Distinct class names from {@link findRangeInputs} so
 * the slider thumbs don't shadow the number inputs and vice versa.
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
 * Coerce an input's `.value` string into the shape the store action expects:
 * empty → null, numeric → Number, anything else → null. The store action drops
 * invalid bounds anyway, but normalising here avoids a redundant search-token
 * bump. Mirrors `parsePriceBound` in url-state.js so the slider and URL reader
 * agree on what "no bound" means.
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
 * Pin the parsed pair so `min <= max` — native range inputs let a user drag
 * past their sibling. Snaps the side that just moved (whichever input has
 * focus) so the stationary thumb stays put.
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
 * Read the slider track's bounds from the range thumbs' `min` / `max` HTML
 * attributes. These describe the store's full catalogue range (server-rendered
 * by render.php) and stay fixed for the page's lifetime — applying other
 * filters narrows the result set but does not shrink the slider, mirroring WC.
 *
 * @param {HTMLElement|null} wrapper - Block wrapper element.
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
		 * `data-wp-bind--value` for the min number input. Returns an empty
		 * string when no bound is set so the input renders blank rather than
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
		 * Companion getter for the max input. Same null-safe pattern as
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
		 * Submit-on-Enter for the number inputs. Blurs the field so the
		 * native `change` event fires and `onPriceRangeInputChange` commits
		 * — without waiting for the user to tab away.
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
		 * Live drag handler for the slider thumbs. `input` fires ~60×/s
		 * while the user drags; we update `state.priceRange` so the watcher
		 * repaints the fill and the number inputs' bound getter re-evaluates,
		 * but defer the search to `onPriceSliderChange` (release).
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
		 * Release handler (`change` event) for the slider thumbs. Commits via
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
		 * Reactive watcher attached via `data-wp-watch` only in slider mode.
		 * Re-runs on every `state.priceRange` change to repaint the
		 * `--low` / `--high` track gradient, sync the range thumbs, and
		 * refresh `aria-valuetext`. The number inputs sync automatically
		 * via their `data-wp-bind--value` getter — no manual write needed.
		 *
		 * No-ops when the slider DOM isn't present (filter variation), so
		 * it's safe even if the watch attribute somehow ends up on a
		 * filter-mode wrapper.
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
