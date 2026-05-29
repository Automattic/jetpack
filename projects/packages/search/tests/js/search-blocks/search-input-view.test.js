// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its actions/callbacks captured. Mirrors the
// pattern in filter-wc-price-view.test.js / results-sort-view.test.js.
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
		getContext: () => null,
		getElement: () => elementRef.current,
	} ),
	{ virtual: true }
);

jest.mock( '../../../src/search-blocks/store', () => ( {} ), { virtual: true } );
jest.mock( '../../../src/search-blocks/blocks/search-input/style.scss', () => ( {} ), {
	virtual: true,
} );
jest.mock( '../../../src/search-blocks/blocks/search-input/suggestions', () => ( {
	clearSuggestionsContext: jest.fn(),
	handleInputForSuggestions: jest.fn(),
	handleKeydownForSuggestions: jest.fn().mockReturnValue( false ),
} ) );

require( '../../../src/search-blocks/blocks/search-input/view' );

/**
 * Mount a `<input type="search">` with the given value, optionally inside a
 * `[hidden]` wrapper that mimics the overlay shell during hydration.
 *
 * @param {{value?: string, hidden?: boolean}} [opts] - Initial state.
 * @return {HTMLInputElement} The input.
 */
function mountInput( { value = '', hidden = false } = {} ) {
	document.body.innerHTML = '';
	const wrapper = document.createElement( 'div' );
	if ( hidden ) {
		wrapper.setAttribute( 'hidden', '' );
	}
	const input = document.createElement( 'input' );
	input.type = 'search';
	input.value = value;
	wrapper.appendChild( input );
	document.body.appendChild( wrapper );
	return input;
}

describe( 'search-input view — initFocusInputIfHasQuery callback', () => {
	beforeEach( () => {
		captured.state.searchQuery = '';
		elementRef.current = { ref: null };
	} );

	it( 'focuses the input and places the cursor at the end when a query exists', () => {
		const input = mountInput( { value: 'hello' } );
		elementRef.current = { ref: input };
		captured.state.searchQuery = 'hello';

		captured.callbacks.initFocusInputIfHasQuery();

		expect( input ).toHaveFocus();
		expect( input.selectionStart ).toBe( 5 );
		expect( input.selectionEnd ).toBe( 5 );
	} );

	it( 'leaves focus alone when the query is empty', () => {
		const input = mountInput( { value: '' } );
		elementRef.current = { ref: input };
		captured.state.searchQuery = '';

		captured.callbacks.initFocusInputIfHasQuery();

		expect( input ).not.toHaveFocus();
	} );

	it( 'no-ops when the input is inside a hidden wrapper (e.g. overlay template clone)', () => {
		const input = mountInput( { value: 'hello', hidden: true } );
		elementRef.current = { ref: input };
		captured.state.searchQuery = 'hello';

		captured.callbacks.initFocusInputIfHasQuery();

		expect( input ).not.toHaveFocus();
	} );

	it( 'no-ops when getElement returns no ref', () => {
		elementRef.current = { ref: null };
		captured.state.searchQuery = 'hello';

		expect( () => captured.callbacks.initFocusInputIfHasQuery() ).not.toThrow();
	} );

	it( 'tolerates input types that reject setSelectionRange', () => {
		const input = mountInput( { value: 'hello' } );
		input.setSelectionRange = () => {
			throw new Error( 'unsupported' );
		};
		elementRef.current = { ref: input };
		captured.state.searchQuery = 'hello';

		expect( () => captured.callbacks.initFocusInputIfHasQuery() ).not.toThrow();
		expect( input ).toHaveFocus();
	} );
} );
