// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its actions captured. Mirrors the pattern
// in results-sort-view.test.js / filter-checkbox-view.test.js.
const captured = {
	state: {},
	actions: {},
	callbacks: {},
};
const elementRef = { current: { ref: null } };

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					const descriptor = descriptors[ key ];
					if ( typeof descriptor.get === 'function' ) {
						Object.defineProperty( captured.state, key, descriptor );
					} else {
						captured.state[ key ] = descriptor.value;
					}
				}
				Object.assign( captured.actions, config.actions || {} );
				Object.assign( captured.callbacks, config.callbacks || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getElement: () => elementRef.current,
	} ),
	{ virtual: true }
);

jest.mock( '../../../src/search-blocks/store', () => ( {} ), { virtual: true } );
jest.mock( '../../../src/search-blocks/blocks/filter-wc-price-slider/style.scss', () => ( {} ), {
	virtual: true,
} );

// The view module runs `store(NAMESPACE, config)` at import time, populating
// `captured.actions` / `captured.callbacks`.
require( '../../../src/search-blocks/blocks/filter-wc-price-slider/view' );

/**
 * Drive an Interactivity API generator action to completion. Mirrors the
 * runGenerator helper in store.test.js — needed because change-event handlers
 * are generator actions.
 *
 * @param {Generator} generator - Action generator returned by the action call.
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

/**
 * Build the wrapper + min/max range inputs and append to document.body.
 *
 * @param {{minValue?: string, maxValue?: string}} [opts] - Optional initial values.
 * @return {{wrapper: HTMLElement, min: HTMLInputElement, max: HTMLInputElement}} References to the mounted nodes.
 */
function mountSliderDom( { minValue = '0', maxValue = '100' } = {} ) {
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'jetpack-search-filter-wc-price-slider';
	wrapper.innerHTML = `
		<input
			class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--min"
			type="range" min="0" max="100" step="1" value="${ minValue }" />
		<input
			class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--max"
			type="range" min="0" max="100" step="1" value="${ maxValue }" />
	`;
	document.body.appendChild( wrapper );
	return {
		wrapper,
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--max' ),
	};
}

describe( 'filter-wc-price-slider view — drag updates state without searching', () => {
	let setPriceRangeSpy;
	let searchSpy;

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		searchSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.actions.search = searchSpy;
		captured.state.priceRange = null;
		captured.state.priceCurrencySymbol = '$';
		captured.state.priceCurrencySymbolPosition = 'left';
		document.body.innerHTML = '';
	} );

	it( 'input events write to state.priceRange but never trigger a search', () => {
		const { min } = mountSliderDom();
		elementRef.current = { ref: min };

		for ( const v of [ '10', '20', '30', '40' ] ) {
			min.value = v;
			captured.actions.onPriceSliderInput();
		}

		// State follows the live drag.
		expect( captured.state.priceRange ).toEqual( { min: 40, max: 100 } );
		// No search was dispatched — that's the change handler's job.
		expect( setPriceRangeSpy ).not.toHaveBeenCalled();
		expect( searchSpy ).not.toHaveBeenCalled();
	} );

	it( 'identical bounds in successive input events no-op the state write', () => {
		const { min } = mountSliderDom( { minValue: '25', maxValue: '80' } );
		elementRef.current = { ref: min };

		captured.state.priceRange = { min: 25, max: 80 };
		const before = captured.state.priceRange;
		captured.actions.onPriceSliderInput();
		// Same object reference — the no-op guard avoided a needless write.
		expect( captured.state.priceRange ).toBe( before );
	} );
} );

describe( 'filter-wc-price-slider view — change commits via setPriceRange', () => {
	let setPriceRangeSpy;
	let searchSpy;

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		searchSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.actions.search = searchSpy;
		captured.state.priceRange = null;
		document.body.innerHTML = '';
	} );

	it( 'a single change event after a drag dispatches setPriceRange exactly once with the final values', async () => {
		const { min } = mountSliderDom();
		elementRef.current = { ref: min };

		// Drag — input events do their thing, no search.
		for ( const v of [ '10', '20', '30' ] ) {
			min.value = v;
			captured.actions.onPriceSliderInput();
		}
		expect( setPriceRangeSpy ).not.toHaveBeenCalled();

		// Release — change handler is a generator, drive it like the runtime would.
		await runGenerator( captured.actions.onPriceSliderChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 30, 100 );
	} );

	it( 'falls through to actions.search when setPriceRange no-ops on identity (drag pre-wrote state)', async () => {
		const { max } = mountSliderDom( { minValue: '15', maxValue: '50' } );
		elementRef.current = { ref: max };

		max.value = '85';
		captured.actions.onPriceSliderInput();
		// Drag wrote state.priceRange = {15, 85}. Now release.
		await runGenerator( captured.actions.onPriceSliderChange() );

		// setPriceRange always called with the bounds, but it'd identity-no-op
		// internally when state matched. The view falls through to actions.search
		// to ensure the URL / results catch up.
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 15, 85 );
		expect( searchSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not double-search on the keyboard-only path (change without preceding input)', async () => {
		const { max } = mountSliderDom( { minValue: '0', maxValue: '50' } );
		elementRef.current = { ref: max };

		// Keyboard arrows / programmatic change can fire `change` without a prior
		// `input`, so state.priceRange hasn't been pre-written by the drag handler.
		// In this path setPriceRange triggers its own internal search; the view
		// must not also fall through to actions.search.
		captured.state.priceRange = null;
		max.value = '50';
		await runGenerator( captured.actions.onPriceSliderChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 0, 50 );
		expect( searchSpy ).not.toHaveBeenCalled();
	} );

	it( 'pins the min thumb to the max value when dragged past the upper bound', () => {
		const { min, max } = mountSliderDom( { minValue: '20', maxValue: '40' } );
		// activeElement defaults to body unless we focus a slider; explicitly
		// activate min to mirror "user is currently dragging the min thumb".
		elementRef.current = { ref: min };
		min.focus();

		min.value = '60';
		captured.actions.onPriceSliderInput();

		// State reflects the clamped pair, not the inverted user input.
		expect( captured.state.priceRange ).toEqual( { min: 40, max: 40 } );
		expect( min.value ).toBe( '40' );
		expect( max.value ).toBe( '40' );
	} );

	it( 'pins the max thumb to the min value when dragged below the lower bound', () => {
		const { min, max } = mountSliderDom( { minValue: '40', maxValue: '60' } );
		// User is dragging the max thumb — focus it so the clampPair guard
		// snaps the side that actually moved (not the stationary min thumb).
		elementRef.current = { ref: max };
		max.focus();

		max.value = '20';
		captured.actions.onPriceSliderInput();

		expect( captured.state.priceRange ).toEqual( { min: 40, max: 40 } );
		expect( max.value ).toBe( '40' );
		// Min element untouched — only the crossing thumb snaps.
		expect( min.value ).toBe( '40' );
	} );
} );

describe( 'filter-wc-price-slider view — updatePriceSliderUi callback', () => {
	/**
	 * Build the wrapper close to the shape `render.php` produces: the range
	 * track with its two thumbs at the top, then the `[min] – [max]` number-
	 * input row below. The watcher reads `state.priceRange`, paints the
	 * `--low` / `--high` gradient, syncs the range thumbs, and sets
	 * `aria-valuetext`. The number inputs sync via `data-wp-bind--value` —
	 * not via this callback — so we don't assert on their value here.
	 *
	 * @return {{wrapper: HTMLElement, range: HTMLElement, minInput: HTMLInputElement, maxInput: HTMLInputElement}} Mounted nodes.
	 */
	function mountFullSliderDom() {
		document.body.innerHTML = '';
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'jetpack-search-filter-wc-price-slider';
		wrapper.innerHTML = `
			<div class="jetpack-search-filter-wc-price-slider__range">
				<input class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--min" type="range" min="0" max="100" step="1" value="0" />
				<input class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--max" type="range" min="0" max="100" step="1" value="100" />
			</div>
			<div class="jetpack-search-filter-wc-price-slider__inputs">
				<input class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--min" type="number" />
				<input class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--max" type="number" />
			</div>
		`;
		document.body.appendChild( wrapper );
		return {
			wrapper,
			range: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__range' ),
			minInput: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--min' ),
			maxInput: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__input--max' ),
		};
	}

	beforeEach( () => {
		captured.state.priceRange = null;
		captured.state.priceCurrencySymbol = '$';
		captured.state.priceCurrencySymbolPosition = 'left';
	} );

	it( 'updates --low / --high from state.priceRange against the slider track bounds', () => {
		const { wrapper, range } = mountFullSliderDom();
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = { min: 25, max: 80 };
		captured.callbacks.updatePriceSliderUi();

		expect( range.style.getPropertyValue( '--low' ) ).toBe( '25%' );
		expect( range.style.getPropertyValue( '--high' ) ).toBe( '80%' );
	} );

	it( 'falls back to input min/max when no priceRange is set', () => {
		const { wrapper, range, minInput, maxInput } = mountFullSliderDom();
		minInput.setAttribute( 'max', '200' );
		maxInput.setAttribute( 'max', '200' );
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = null;
		captured.callbacks.updatePriceSliderUi();

		expect( range.style.getPropertyValue( '--low' ) ).toBe( '0%' );
		expect( range.style.getPropertyValue( '--high' ) ).toBe( '100%' );
	} );

	it( 'sets aria-valuetext on the range thumbs to the currency-formatted label so screen readers announce "$25" instead of the raw numeric value', () => {
		const { wrapper, minInput, maxInput } = mountFullSliderDom();
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = { min: 25, max: 80 };
		captured.callbacks.updatePriceSliderUi();

		expect( minInput ).toHaveAttribute( 'aria-valuetext', '$25' );
		expect( maxInput ).toHaveAttribute( 'aria-valuetext', '$80' );
	} );
} );

describe( 'filter-wc-price-slider view — number-input commit handlers', () => {
	let setPriceRangeSpy;

	/**
	 * Build the wrapper with just the two number inputs (the row that sits
	 * below the slider track). The `change` handler only reads these.
	 *
	 * @param {{min?: string, max?: string}} [opts] - Optional initial values.
	 * @return {{wrapper: HTMLElement, min: HTMLInputElement, max: HTMLInputElement}} Mounted nodes.
	 */
	function mountNumberInputDom( { min = '', max = '' } = {} ) {
		document.body.innerHTML = '';
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'jetpack-search-filter-wc-price-slider';
		wrapper.innerHTML = `
			<input class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--min" type="number" value="${ min }" />
			<input class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--max" type="number" value="${ max }" />
		`;
		document.body.appendChild( wrapper );
		return {
			wrapper,
			min: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__number-input--min' ),
			max: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__number-input--max' ),
		};
	}

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.state.priceRange = null;
	} );

	it( 'reads both inputs and dispatches setPriceRange with the parsed pair on change', async () => {
		const { min } = mountNumberInputDom( { min: '15', max: '95' } );
		elementRef.current = { ref: min };

		await runGenerator( captured.actions.onPriceSliderNumberInputChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 15, 95 );
	} );

	it( 'normalises empty inputs to null bounds so the store action drops them cleanly', async () => {
		const { min } = mountNumberInputDom( { min: '', max: '50' } );
		elementRef.current = { ref: min };

		await runGenerator( captured.actions.onPriceSliderNumberInputChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( null, 50 );
	} );

	it( 'Enter blurs the active input and prevents the default submit so the change event commits without a page nav', () => {
		const { min } = mountNumberInputDom();
		min.focus();
		const preventDefault = jest.fn();
		const blur = jest.spyOn( min, 'blur' );

		captured.actions.onPriceSliderNumberInputKeydown( {
			key: 'Enter',
			target: min,
			preventDefault,
		} );

		expect( preventDefault ).toHaveBeenCalled();
		expect( blur ).toHaveBeenCalled();
	} );

	it( 'non-Enter keystrokes pass through untouched so typing remains uninterrupted', () => {
		const { min } = mountNumberInputDom();
		const preventDefault = jest.fn();

		captured.actions.onPriceSliderNumberInputKeydown( {
			key: '5',
			target: min,
			preventDefault,
		} );

		expect( preventDefault ).not.toHaveBeenCalled();
	} );
} );

describe( 'filter-wc-price-slider view — input-value getters', () => {
	beforeEach( () => {
		captured.state.priceRange = null;
	} );

	it( 'returns empty strings when no priceRange is set so the inputs render blank rather than "null"', () => {
		captured.state.priceRange = null;
		expect( captured.state.priceRangeMinInputValue ).toBe( '' );
		expect( captured.state.priceRangeMaxInputValue ).toBe( '' );
	} );

	it( 'stringifies present bounds so data-wp-bind--value can apply them directly to the input', () => {
		captured.state.priceRange = { min: 10, max: 250 };
		expect( captured.state.priceRangeMinInputValue ).toBe( '10' );
		expect( captured.state.priceRangeMaxInputValue ).toBe( '250' );
	} );

	it( 'returns empty for an explicitly-null bound on the half-open range case (e.g. only max set)', () => {
		captured.state.priceRange = { min: null, max: 50 };
		expect( captured.state.priceRangeMinInputValue ).toBe( '' );
		expect( captured.state.priceRangeMaxInputValue ).toBe( '50' );
	} );
} );
