// `@wordpress/interactivity` is an externalized dep — mock virtually.
const captured = {
	state: {},
	actions: {},
	callbacks: {},
};
const contextRef = { current: { sortKey: '' } };
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
		getContext: () => contextRef.current,
		getElement: () => elementRef.current,
	} ),
	{ virtual: true }
);

jest.mock( '../../../src/search-blocks/store', () => ( {} ), { virtual: true } );
jest.mock( '../../../src/search-blocks/blocks/results-sort/style.scss', () => ( {} ), {
	virtual: true,
} );

require( '../../../src/search-blocks/blocks/results-sort/view' );

describe( 'results-sort view store', () => {
	beforeEach( () => {
		captured.state.sortOrder = 'relevance';
		captured.state.sortMenuFocusedKey = null;
		captured.state.isSortPopoverOpen = false;
		contextRef.current = { sortKey: '' };
		elementRef.current = { ref: null };
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

	describe( 'sortMenuItemTabIndex', () => {
		it( 'returns "0" for the active sort item when no key is keyboard-focused', () => {
			captured.state.sortOrder = 'newest';
			captured.state.sortMenuFocusedKey = null;
			contextRef.current = { sortKey: 'newest' };
			expect( captured.state.sortMenuItemTabIndex ).toBe( '0' );
		} );

		it( 'returns "-1" for inactive items when no key is keyboard-focused', () => {
			captured.state.sortOrder = 'newest';
			captured.state.sortMenuFocusedKey = null;
			contextRef.current = { sortKey: 'oldest' };
			expect( captured.state.sortMenuItemTabIndex ).toBe( '-1' );
		} );

		it( 'prefers sortMenuFocusedKey over sortOrder once the user navigates the menu', () => {
			captured.state.sortOrder = 'newest';
			captured.state.sortMenuFocusedKey = 'oldest';
			contextRef.current = { sortKey: 'oldest' };
			expect( captured.state.sortMenuItemTabIndex ).toBe( '0' );
			contextRef.current = { sortKey: 'newest' };
			expect( captured.state.sortMenuItemTabIndex ).toBe( '-1' );
		} );
	} );

	describe( 'focusSelectedSortMenuItem callback', () => {
		it( 'focuses the menu item when it matches the keyboard-focused key', () => {
			const focus = jest.fn();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			contextRef.current = { sortKey: 'newest' };
			elementRef.current = { ref: { focus } };
			captured.callbacks.focusSelectedSortMenuItem();
			expect( focus ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does nothing when the popover is closed', () => {
			const focus = jest.fn();
			captured.state.isSortPopoverOpen = false;
			captured.state.sortMenuFocusedKey = 'newest';
			contextRef.current = { sortKey: 'newest' };
			elementRef.current = { ref: { focus } };
			captured.callbacks.focusSelectedSortMenuItem();
			expect( focus ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when no key is keyboard-focused (mouse-opened menu)', () => {
			const focus = jest.fn();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = null;
			contextRef.current = { sortKey: 'newest' };
			elementRef.current = { ref: { focus } };
			captured.callbacks.focusSelectedSortMenuItem();
			expect( focus ).not.toHaveBeenCalled();
		} );

		it( 'does nothing on items that are not the keyboard-focused key', () => {
			const focus = jest.fn();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			contextRef.current = { sortKey: 'oldest' };
			elementRef.current = { ref: { focus } };
			captured.callbacks.focusSelectedSortMenuItem();
			expect( focus ).not.toHaveBeenCalled();
		} );
	} );
} );
