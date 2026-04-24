// `@wordpress/interactivity` is an externalized dep — mock virtually.
const captured = {
	state: {},
	actions: {},
};
const contextRef = { current: { sortKey: '' } };

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
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => contextRef.current,
	} ),
	{ virtual: true }
);

jest.mock( '../../../src/search-blocks/store', () => ( {} ), { virtual: true } );
jest.mock( '../../../src/search-blocks/blocks/sort-control/style.scss', () => ( {} ), {
	virtual: true,
} );

require( '../../../src/search-blocks/blocks/sort-control/view' );

describe( 'sort-control view store', () => {
	beforeEach( () => {
		captured.state.sortOrder = 'relevance';
		contextRef.current = { sortKey: '' };
	} );

	it( 'returns true from isSortOptionSelected when the radio key matches the active sort', () => {
		captured.state.sortOrder = 'newest';
		contextRef.current = { sortKey: 'newest' };
		expect( captured.state.isSortOptionSelected ).toBe( true );
	} );

	it( 'returns false from isSortOptionSelected when the radio key differs from the active sort', () => {
		captured.state.sortOrder = 'newest';
		contextRef.current = { sortKey: 'oldest' };
		expect( captured.state.isSortOptionSelected ).toBe( false );
	} );

	it( 'writes the selected sort key into state and triggers a new search', () => {
		const search = jest.fn();
		captured.actions.search = search;
		const event = { target: { value: 'newest' } };
		const generator = captured.actions.onSortChange( event );
		const step = generator.next();
		expect( captured.state.sortOrder ).toBe( 'newest' );
		expect( search ).toHaveBeenCalledTimes( 1 );
		expect( step.done ).toBe( false );
		expect( generator.next().done ).toBe( true );
	} );
} );
