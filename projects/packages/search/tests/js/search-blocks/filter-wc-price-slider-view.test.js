// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its actions captured. Mirrors the pattern
// in results-sort-view.test.js / filter-checkbox-view.test.js.
const captured = {
	state: {},
	actions: {},
	callbacks: {},
};
const elementRef = { current: { ref: null } };
const contextRef = { current: null };

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
		getContext: () => {
			if ( contextRef.current === null ) {
				throw new Error( 'getContext called outside Interactivity scope' );
			}
			return contextRef.current;
		},
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
		contextRef.current = null;
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
		contextRef.current = null;
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
} );

describe( 'filter-wc-price-slider view — input value getters', () => {
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

describe( 'filter-wc-price-slider view — updatePriceSliderUi callback', () => {
	/**
	 * Build the wrapper with the range track and value labels — closer to the
	 * shape render.php produces, since the wrapper-level callback walks all
	 * three pieces of UI together.
	 *
	 * @return {{wrapper: HTMLElement, range: HTMLElement, minLabel: HTMLElement, maxLabel: HTMLElement}} Mounted nodes.
	 */
	function mountFullSliderDom() {
		document.body.innerHTML = '';
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'jetpack-search-filter-wc-price-slider';
		wrapper.innerHTML = `
			<div class="jetpack-search-filter-wc-price-slider__left">
				<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--min"></span>
			</div>
			<div class="jetpack-search-filter-wc-price-slider__range"></div>
			<div class="jetpack-search-filter-wc-price-slider__right">
				<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--max"></span>
			</div>
		`;
		document.body.appendChild( wrapper );
		return {
			wrapper,
			range: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__range' ),
			minLabel: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__value--min' ),
			maxLabel: wrapper.querySelector( '.jetpack-search-filter-wc-price-slider__value--max' ),
		};
	}

	beforeEach( () => {
		captured.state.priceRange = null;
		captured.state.priceCurrencySymbol = '$';
		captured.state.priceCurrencySymbolPosition = 'left';
		contextRef.current = null;
	} );

	it( 'updates --low / --high and label text from state.priceRange + slider bounds context', () => {
		const { wrapper, range, minLabel, maxLabel } = mountFullSliderDom();
		elementRef.current = { ref: wrapper };
		contextRef.current = { sliderMin: 0, sliderMax: 100 };

		captured.state.priceRange = { min: 25, max: 80 };
		captured.callbacks.updatePriceSliderUi();

		expect( range.style.getPropertyValue( '--low' ) ).toBe( '25%' );
		expect( range.style.getPropertyValue( '--high' ) ).toBe( '80%' );
		expect( minLabel ).toHaveTextContent( '$25' );
		expect( maxLabel ).toHaveTextContent( '$80' );
	} );

	it( 'falls back to slider bounds when no priceRange is set — labels show the slider min / max', () => {
		const { wrapper, range, minLabel, maxLabel } = mountFullSliderDom();
		elementRef.current = { ref: wrapper };
		contextRef.current = { sliderMin: 0, sliderMax: 200 };

		captured.state.priceRange = null;
		captured.callbacks.updatePriceSliderUi();

		expect( range.style.getPropertyValue( '--low' ) ).toBe( '0%' );
		expect( range.style.getPropertyValue( '--high' ) ).toBe( '100%' );
		expect( minLabel ).toHaveTextContent( '$0' );
		expect( maxLabel ).toHaveTextContent( '$200' );
	} );
} );
