import { store, getElement, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the min and max range inputs that share a parent block wrapper with
 * `el`. Used by the input/change handlers to read both bounds when either
 * thumb moves (the store action takes both bounds together).
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
 * Coerce an input's `.value` string into a numeric bound. Returns null for
 * empty / NaN / negative inputs, mirroring `parsePriceBound` in url-state.js so
 * the slider and the URL reader treat "no bound" the same way.
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
 * Read the parsed pair, pinning the lower thumb to the upper value when they
 * cross. Native `<input type="range">` lets a user drag past its sibling, but
 * we want them to clamp at the meeting point so the dispatched bounds always
 * satisfy `min <= max` and the visible thumb position matches the committed
 * value.
 *
 * @param {HTMLInputElement|null} minEl - Min slider element.
 * @param {HTMLInputElement|null} maxEl - Max slider element.
 * @return {{min: number|null, max: number|null}} Clamped, parsed bounds.
 */
function clampPair( minEl, maxEl ) {
	let minVal = parseBound( minEl?.value );
	let maxVal = parseBound( maxEl?.value );
	if ( minVal !== null && maxVal !== null && minVal > maxVal ) {
		// Pick the side that didn't just move by checking activeElement on
		// the input's owner document — dragging the min thumb past max should
		// pin min to max, dragging max below min should pin max to min. Falls
		// back to clamping min when activeElement isn't one of the inputs
		// (e.g. programmatic dispatch).
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
 * Format a numeric bound for the value-label span. Renders integers — the
 * underlying input value carries the author-set step's precision, but the
 * visible label rounds to a whole number so a 4-pixel drag doesn't churn
 * "$24.96 / $25.04 / $25.12".
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
 * Read the slider's track bounds from the wrapper's Interactivity context.
 * These describe the store's full catalogue range (computed server-side from
 * `wp_postmeta._price`) and stay fixed for the page's lifetime — applying
 * other filters narrows the result set but does not shrink the slider, so the
 * user can always drag back out. Mirrors WooCommerce's price slider: stable
 * track, only thumb positions move with filters.
 *
 * Falls through to the input element's `min`/`max` attributes when context
 * isn't available (e.g. inside a unit test running view.js directly).
 *
 * @param {HTMLElement|null} wrapper - Slider wrapper element.
 * @return {{sliderMin: number, sliderMax: number}} Track bounds.
 */
function readSliderBounds( wrapper ) {
	try {
		const ctx = getContext();
		if (
			ctx &&
			Number.isFinite( Number( ctx.sliderMin ) ) &&
			Number.isFinite( Number( ctx.sliderMax ) )
		) {
			return {
				sliderMin: Number( ctx.sliderMin ),
				sliderMax: Number( ctx.sliderMax ),
			};
		}
	} catch {
		// getContext() throws outside an Interactivity scope (e.g. tests). Fall through.
	}
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
		 * Live drag handler. `<input type="range">` fires `input` continuously
		 * while the user drags — at 60fps that's ~60 events/second. We update
		 * `state.priceRange` immediately so the colored fill (driven by the
		 * `updatePriceSliderUi` watcher) and the value labels follow the thumb
		 * in real time, but we **do not** trigger a search here. The commit /
		 * search dispatch lives in `onPriceSliderChange`, bound to the native
		 * `change` event which fires once on release — same split WC Blocks
		 * uses for its dual-thumb price slider.
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
		 * Release handler. `<input type="range">` fires `change` on mouseup /
		 * keyup / touchend — the natural "I'm done dragging" signal. Commits
		 * the current bounds via `actions.setPriceRange`, which validates,
		 * pushes the URL, and fetches results.
		 *
		 * `setPriceRange` searches internally when it actually writes new state.
		 * The pointer drag path pre-writes state via `onPriceSliderInput`, so
		 * `setPriceRange` no-ops there and the URL/results stay stale unless we
		 * trigger our own search. Capture the no-op status _before_ calling
		 * `setPriceRange` (afterwards `state.priceRange` always matches `bounds`,
		 * which would mask whether a write happened) so keyboard-only changes —
		 * which fire `change` without a preceding `input` — get exactly one
		 * search from `setPriceRange` and not a duplicate from us.
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
	},

	callbacks: {
		/**
		 * Reactive watcher attached to the slider wrapper via `data-wp-watch`.
		 * Re-runs whenever any reactive read inside it changes — primarily
		 * `state.priceRange`. Updates two pieces of UI for this slider instance:
		 * the `--low` / `--high` CSS custom properties on the `__range` track
		 * (so the colored active-range gradient grows / shrinks with the thumbs)
		 * and the text content of the `__value--min` / `__value--max` spans (so
		 * the visible labels track the current bounds).
		 *
		 * Both updates run together so a single drag + release commits a single
		 * paint frame's worth of UI changes. Pre-hydration the labels are
		 * already correct from render.php's seeded text.
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
			const minLabel = wrapper.querySelector(
				'.jetpack-search-filter-wc-price-slider__value--min'
			);
			const maxLabel = wrapper.querySelector(
				'.jetpack-search-filter-wc-price-slider__value--max'
			);
			const { state } = store( NAMESPACE );
			const { sliderMin, sliderMax } = readSliderBounds( wrapper );
			const priceRange = state.priceRange;
			const minVal = priceRange?.min ?? sliderMin;
			const maxVal = priceRange?.max ?? sliderMax;
			const symbol = state.priceCurrencySymbol || '';
			const position = state.priceCurrencySymbolPosition || 'left';

			// Sync input values with state so external changes (popstate, a
			// clear-filters action) move the thumbs. Skip the input the user is
			// currently dragging — overwriting its own value mid-drag would jitter
			// the thumb against the user's pointer.
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

			if ( minLabel ) {
				minLabel.textContent = formatBoundLabel( minVal, symbol, position );
			}
			if ( maxLabel ) {
				maxLabel.textContent = formatBoundLabel( maxVal, symbol, position );
			}
		},
	},
} );
