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
// `captured.actions`. Loading once is enough for the whole suite — the mock's
// merge-on-each-call semantics mean a re-import wouldn't change anything.
require( '../../../src/search-blocks/blocks/filter-wc-price-slider/view' );

const DEBOUNCE_MS = 300;

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

describe( 'filter-wc-price-slider view — debounced setPriceRange', () => {
	let setPriceRangeSpy;

	beforeEach( () => {
		jest.useFakeTimers();
		// `setPriceRange` is a generator action on the shared store; the view
		// drives it via runGenerator, so the spy needs to be a generator too.
		setPriceRangeSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.state.priceRange = null;
		document.body.innerHTML = '';
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'collapses sequential input events into a single setPriceRange call after the debounce window', () => {
		const { min } = mountSliderDom();
		elementRef.current = { ref: min };

		min.value = '10';
		captured.actions.onPriceSliderInput();
		min.value = '20';
		captured.actions.onPriceSliderInput();
		min.value = '30';
		captured.actions.onPriceSliderInput();

		// Pre-flush: nothing dispatched while drag is in flight.
		expect( setPriceRangeSpy ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( DEBOUNCE_MS );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 30, 100 );
	} );

	it( 'coalesces a drag-then-release (input then change) into one call', () => {
		const { max } = mountSliderDom();
		elementRef.current = { ref: max };

		// Simulate `input` firing during drag, then `change` on release. Both
		// wire the same handler — the timer reset on the second call ensures a
		// single dispatch fires after the window elapses.
		max.value = '70';
		captured.actions.onPriceSliderInput();
		max.value = '60';
		captured.actions.onPriceSliderInput();

		jest.advanceTimersByTime( DEBOUNCE_MS );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 0, 60 );
	} );

	it( 'parses both bounds independently — moving only the max slider keeps min at its current value', () => {
		const { max } = mountSliderDom( { minValue: '15', maxValue: '50' } );
		elementRef.current = { ref: max };

		max.value = '85';
		captured.actions.onPriceSliderInput();
		jest.advanceTimersByTime( DEBOUNCE_MS );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 15, 85 );
	} );

	it( 'pins the min thumb to the max value when the user drags it past the upper bound', () => {
		const { min, max } = mountSliderDom( { minValue: '20', maxValue: '40' } );
		elementRef.current = { ref: min };

		// User drags min past max — the store-side guard would silently drop
		// an inverted range, so the view clamps the lower thumb to the upper
		// value and dispatches a degenerate but searchable equal-bounds range.
		min.value = '60';
		captured.actions.onPriceSliderInput();
		jest.advanceTimersByTime( DEBOUNCE_MS );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 40, 40 );
		expect( min.value ).toBe( '40' );
		// Max element untouched.
		expect( max.value ).toBe( '40' );
	} );
} );

describe( 'filter-wc-price-slider view — value getters', () => {
	beforeEach( () => {
		captured.state.priceRange = null;
	} );

	it( 'returns empty strings when no priceRange is set so the input falls back to its static value', () => {
		expect( captured.state.priceSliderMinValue ).toBe( '' );
		expect( captured.state.priceSliderMaxValue ).toBe( '' );
	} );

	it( 'returns string forms of priceRange.min/max when set', () => {
		captured.state.priceRange = { min: 25, max: 80 };
		expect( captured.state.priceSliderMinValue ).toBe( '25' );
		expect( captured.state.priceSliderMaxValue ).toBe( '80' );
	} );

	it( 'handles half-open ranges — null bound reads as empty string', () => {
		captured.state.priceRange = { min: 25, max: null };
		expect( captured.state.priceSliderMinValue ).toBe( '25' );
		expect( captured.state.priceSliderMaxValue ).toBe( '' );
	} );
} );
