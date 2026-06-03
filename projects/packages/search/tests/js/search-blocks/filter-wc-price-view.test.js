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
jest.mock( '../../../src/search-blocks/blocks/filter-wc-price/style.scss', () => ( {} ), {
	virtual: true,
} );

// The view module runs `store(NAMESPACE, config)` at import time, populating
// `captured.actions` / `captured.callbacks`.
require( '../../../src/search-blocks/blocks/filter-wc-price/view' );

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
 * Build the wrapper + two number inputs (filter layout).
 *
 * @param {{min?: string, max?: string}} [opts] - Optional initial values.
 * @return {{wrapper: HTMLElement, min: HTMLInputElement, max: HTMLInputElement}} Mounted nodes.
 */
function mountFilterDom( { min = '', max = '' } = {} ) {
	document.body.innerHTML = '';
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'jetpack-search-filter-wc-price';
	wrapper.innerHTML = `
		<input class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--min" type="number" value="${ min }" />
		<input class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--max" type="number" value="${ max }" />
	`;
	document.body.appendChild( wrapper );
	return {
		wrapper,
		min: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--min' ),
		max: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--max' ),
	};
}

/**
 * Build the wrapper + slider thumbs (slider layout). Includes both the range
 * thumbs and the number inputs row so the watcher callback can walk all the
 * pieces it touches in production.
 *
 * @param {{minValue?: string, maxValue?: string}} [opts] - Optional initial slider values.
 * @return {{wrapper: HTMLElement, slider: HTMLElement, sliderMin: HTMLInputElement, sliderMax: HTMLInputElement, numberMin: HTMLInputElement, numberMax: HTMLInputElement}} Mounted nodes.
 */
function mountSliderDom( { minValue = '0', maxValue = '100' } = {} ) {
	document.body.innerHTML = '';
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'jetpack-search-filter-wc-price jetpack-search-filter-wc-price--with-slider';
	wrapper.innerHTML = `
		<div class="jetpack-search-filter-wc-price__slider">
			<input class="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--min" type="range" min="0" max="100" step="1" value="${ minValue }" />
			<input class="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--max" type="range" min="0" max="100" step="1" value="${ maxValue }" />
		</div>
		<div class="jetpack-search-filter-wc-price__inputs">
			<input class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--min" type="number" />
			<input class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--max" type="number" />
		</div>
	`;
	document.body.appendChild( wrapper );
	return {
		wrapper,
		slider: wrapper.querySelector( '.jetpack-search-filter-wc-price__slider' ),
		sliderMin: wrapper.querySelector( '.jetpack-search-filter-wc-price__slider-input--min' ),
		sliderMax: wrapper.querySelector( '.jetpack-search-filter-wc-price__slider-input--max' ),
		numberMin: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--min' ),
		numberMax: wrapper.querySelector( '.jetpack-search-filter-wc-price__input--max' ),
	};
}

describe( 'filter-wc-price view — number-input commit handlers', () => {
	let setPriceRangeSpy;

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.state.priceRange = null;
	} );

	it( 'reads both inputs and dispatches setPriceRange with the parsed pair on change', async () => {
		const { min } = mountFilterDom( { min: '15', max: '95' } );
		elementRef.current = { ref: min };

		await runGenerator( captured.actions.onPriceRangeInputChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 15, 95 );
	} );

	it( 'normalises empty inputs to null bounds so the store action drops them cleanly', async () => {
		const { min } = mountFilterDom( { min: '', max: '50' } );
		elementRef.current = { ref: min };

		await runGenerator( captured.actions.onPriceRangeInputChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( null, 50 );
	} );

	it( 'Enter blurs the active input so the native change event commits without page nav', () => {
		const { min } = mountFilterDom();
		min.focus();
		const preventDefault = jest.fn();
		const blur = jest.spyOn( min, 'blur' );

		captured.actions.onPriceRangeInputKeydown( {
			key: 'Enter',
			target: min,
			preventDefault,
		} );

		expect( preventDefault ).toHaveBeenCalled();
		expect( blur ).toHaveBeenCalled();
	} );

	it( 'non-Enter keystrokes pass through untouched so typing remains uninterrupted', () => {
		const { min } = mountFilterDom();
		const preventDefault = jest.fn();

		captured.actions.onPriceRangeInputKeydown( {
			key: '5',
			target: min,
			preventDefault,
		} );

		expect( preventDefault ).not.toHaveBeenCalled();
	} );
} );

describe( 'filter-wc-price view — input-value getters', () => {
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

describe( 'filter-wc-price view — slider drag updates state without searching', () => {
	let setPriceRangeSpy;
	let searchSpy;

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		searchSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.actions.search = searchSpy;
		captured.state.priceRange = null;
	} );

	it( 'input events write to state.priceRange but never trigger a search', () => {
		const { sliderMin } = mountSliderDom();
		elementRef.current = { ref: sliderMin };

		for ( const v of [ '10', '20', '30', '40' ] ) {
			sliderMin.value = v;
			captured.actions.onPriceSliderInput();
		}

		expect( captured.state.priceRange ).toEqual( { min: 40, max: 100 } );
		expect( setPriceRangeSpy ).not.toHaveBeenCalled();
		expect( searchSpy ).not.toHaveBeenCalled();
	} );

	it( 'identical bounds in successive input events no-op the state write', () => {
		const { sliderMin } = mountSliderDom( { minValue: '25', maxValue: '80' } );
		elementRef.current = { ref: sliderMin };

		captured.state.priceRange = { min: 25, max: 80 };
		const before = captured.state.priceRange;
		captured.actions.onPriceSliderInput();
		expect( captured.state.priceRange ).toBe( before );
	} );

	it( 'pins the min thumb to the max value when dragged past the upper bound', () => {
		const { sliderMin, sliderMax } = mountSliderDom( { minValue: '20', maxValue: '40' } );
		elementRef.current = { ref: sliderMin };
		sliderMin.focus();

		sliderMin.value = '60';
		captured.actions.onPriceSliderInput();

		expect( captured.state.priceRange ).toEqual( { min: 40, max: 40 } );
		expect( sliderMin.value ).toBe( '40' );
		expect( sliderMax.value ).toBe( '40' );
	} );

	it( 'pins the max thumb to the min value when dragged below the lower bound', () => {
		const { sliderMin, sliderMax } = mountSliderDom( { minValue: '40', maxValue: '60' } );
		elementRef.current = { ref: sliderMax };
		sliderMax.focus();

		sliderMax.value = '20';
		captured.actions.onPriceSliderInput();

		expect( captured.state.priceRange ).toEqual( { min: 40, max: 40 } );
		expect( sliderMax.value ).toBe( '40' );
		expect( sliderMin.value ).toBe( '40' );
	} );
} );

describe( 'filter-wc-price view — slider change commits via setPriceRange', () => {
	let setPriceRangeSpy;
	let searchSpy;

	beforeEach( () => {
		setPriceRangeSpy = jest.fn( function* () {} );
		searchSpy = jest.fn( function* () {} );
		captured.actions.setPriceRange = setPriceRangeSpy;
		captured.actions.search = searchSpy;
		captured.state.priceRange = null;
	} );

	it( 'a single change event after a drag dispatches setPriceRange exactly once with the final values', async () => {
		const { sliderMin } = mountSliderDom();
		elementRef.current = { ref: sliderMin };

		for ( const v of [ '10', '20', '30' ] ) {
			sliderMin.value = v;
			captured.actions.onPriceSliderInput();
		}
		expect( setPriceRangeSpy ).not.toHaveBeenCalled();

		await runGenerator( captured.actions.onPriceSliderChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 30, 100 );
	} );

	it( 'falls through to actions.search when setPriceRange no-ops on identity (drag pre-wrote state)', async () => {
		const { sliderMax } = mountSliderDom( { minValue: '15', maxValue: '50' } );
		elementRef.current = { ref: sliderMax };

		sliderMax.value = '85';
		captured.actions.onPriceSliderInput();
		await runGenerator( captured.actions.onPriceSliderChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 15, 85 );
		expect( searchSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not double-search on the keyboard-only path (change without preceding input)', async () => {
		const { sliderMax } = mountSliderDom( { minValue: '0', maxValue: '50' } );
		elementRef.current = { ref: sliderMax };

		captured.state.priceRange = null;
		sliderMax.value = '50';
		await runGenerator( captured.actions.onPriceSliderChange() );

		expect( setPriceRangeSpy ).toHaveBeenCalledWith( 0, 50 );
		expect( searchSpy ).not.toHaveBeenCalled();
	} );
} );

describe( 'filter-wc-price view — updatePriceSliderUi callback', () => {
	beforeEach( () => {
		captured.state.priceRange = null;
		captured.state.priceCurrencySymbol = '$';
		captured.state.priceCurrencySymbolPosition = 'left';
	} );

	it( 'updates --low / --high from state.priceRange against the slider track bounds', () => {
		const { wrapper, slider } = mountSliderDom();
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = { min: 25, max: 80 };
		captured.callbacks.updatePriceSliderUi();

		expect( slider.style.getPropertyValue( '--low' ) ).toBe( '25%' );
		expect( slider.style.getPropertyValue( '--high' ) ).toBe( '80%' );
	} );

	it( 'falls back to slider track min/max when no priceRange is set', () => {
		const { wrapper, slider, sliderMin, sliderMax } = mountSliderDom();
		sliderMin.setAttribute( 'max', '200' );
		sliderMax.setAttribute( 'max', '200' );
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = null;
		captured.callbacks.updatePriceSliderUi();

		expect( slider.style.getPropertyValue( '--low' ) ).toBe( '0%' );
		expect( slider.style.getPropertyValue( '--high' ) ).toBe( '100%' );
	} );

	it( 'sets aria-valuetext on the range thumbs to the currency-formatted label so screen readers announce "$25" instead of the raw numeric value', () => {
		const { wrapper, sliderMin, sliderMax } = mountSliderDom();
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = { min: 25, max: 80 };
		captured.callbacks.updatePriceSliderUi();

		expect( sliderMin ).toHaveAttribute( 'aria-valuetext', '$25' );
		expect( sliderMax ).toHaveAttribute( 'aria-valuetext', '$80' );
	} );

	it( 'no-ops silently when the slider DOM is absent (filter variation)', () => {
		const { wrapper } = mountFilterDom();
		elementRef.current = { ref: wrapper };

		captured.state.priceRange = { min: 25, max: 80 };
		expect( () => captured.callbacks.updatePriceSliderUi() ).not.toThrow();
	} );
} );
