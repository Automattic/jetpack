import { renderHook } from '@testing-library/react';
import { markEstablishedLibrary } from '../../../hooks/use-first-run-state';
import { useLibrary } from '../../../hooks/use-library';
import { CANONICAL_TAB_ORDER, TAB_PATHS, getTabOrder, useDashboardTabOrder } from '../index';

// Pulled in through the component module's `useDashboardTabOrder` import chain.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
} ) );

jest.mock( '../../../hooks/use-library', () => ( {
	useLibrary: jest.fn(),
	LIBRARY_QUERY_KEY: 'library',
} ) );

/**
 * Answer the first-run count query, settled or still in flight.
 *
 * @param options            - Count state.
 * @param options.totalItems - Videos the library reports.
 * @param options.isLoading  - Whether the request is still in flight.
 */
const mockLibraryCount = ( {
	totalItems,
	isLoading,
}: {
	totalItems: number;
	isLoading: boolean;
} ) => {
	( useLibrary as jest.Mock ).mockReturnValue( {
		items: [],
		isLoading,
		isError: false,
		paginationInfo: { totalItems, totalPages: 1 },
	} );
};

describe( 'getTabOrder', () => {
	it( 'leads with Library on first run', () => {
		// With nothing in the library, its empty state — the upload flow —
		// *is* the page, and Home would only echo it.
		expect( getTabOrder( 'first-run' ) ).toEqual( [ 'library', 'stats', 'settings' ] );
	} );

	it( 'leads with Home once the user is past first run', () => {
		expect( getTabOrder( 'home' ) ).toEqual( [ 'home', 'library', 'stats', 'settings' ] );
	} );

	// Upload is never a tab of its own: the Library's empty state carries the
	// flow on first run, and the header's top-right slot carries the action
	// everywhere else. Losing the tab must never mean losing the ability to
	// upload.
	it( 'never offers Upload as a tab', () => {
		expect( getTabOrder( 'first-run' ) ).not.toContain( 'upload' );
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

// The same fix as the one in use-first-run-state, stated as the thing the user
// actually sees. Every in-app arrival is a fresh page load with a cold count,
// so this is the FIRST paint of the strip on `?p=/settings`, `?p=/home` and
// every other deep link.
describe( 'useDashboardTabOrder', () => {
	beforeEach( () => {
		window.localStorage.clear();
		jest.clearAllMocks();
	} );

	it( 'leads with Home from the first render for a remembered library', () => {
		markEstablishedLibrary();
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useDashboardTabOrder() );

		expect( result.current ).toEqual( [ 'home', 'library', 'stats', 'settings' ] );
	} );

	it( 'leads with Library from the first render when nothing is remembered', () => {
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useDashboardTabOrder() );

		expect( result.current ).toEqual( [ 'library', 'stats', 'settings' ] );
	} );
} );
