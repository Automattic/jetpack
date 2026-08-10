import { CANONICAL_TAB_ORDER, TAB_PATHS, getTabOrder } from '../index';

// Pulled in through the component module's `useDashboardTabOrder` import chain.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
} ) );

describe( 'getTabOrder', () => {
	it( 'leads with Upload on first run', () => {
		// With nothing in the library, upload *is* the page.
		expect( getTabOrder( 'first-run' ) ).toEqual( [ 'upload', 'library', 'stats', 'settings' ] );
	} );

	it( 'leads with Home once the user is past first run', () => {
		expect( getTabOrder( 'home' ) ).toEqual( [ 'home', 'library', 'stats', 'settings' ] );
	} );

	// Upload does not vanish, it moves: the action lives in the header's
	// top-right slot once the tab is gone. Losing the tab must never mean
	// losing the ability to upload.
	it( 'drops Upload as a tab in the home state', () => {
		expect( getTabOrder( 'home' ) ).not.toContain( 'upload' );
	} );

	// A new user's Stats read as zeros, so Stats never leads.
	it( 'never leads with Stats', () => {
		expect( getTabOrder( 'first-run' )[ 0 ] ).not.toBe( 'stats' );
		expect( getTabOrder( 'home' )[ 0 ] ).not.toBe( 'stats' );
	} );

	it( 'is pure — repeated calls return equal, independent arrays', () => {
		const first = getTabOrder( 'home' );
		const second = getTabOrder( 'home' );

		expect( first ).toEqual( second );
		first.pop();
		expect( getTabOrder( 'home' ) ).toEqual( second );
	} );

	it( 'only ever returns tabs that have a route path and a canonical position', () => {
		for ( const state of [ 'first-run', 'home' ] as const ) {
			for ( const tab of getTabOrder( state ) ) {
				expect( TAB_PATHS[ tab ] ).toBeTruthy();
				expect( CANONICAL_TAB_ORDER ).toContain( tab );
			}
		}
	} );
} );
