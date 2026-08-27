/**
 * My Jetpack reports its Tracks events under the reader's WordPress.com
 * identity, and that identity is keyed `ID` — capital I, capital D.
 * `Connection\Manager::get_connected_user_data()` returns the WordPress.com
 * response verbatim and `REST_Connector::get_user_connection_data()` passes it
 * through untouched as `wpcomUser`, so the key is whichever one WordPress.com
 * sent; the PHP Tracks path reads that same array as `$wpcom_user_data['ID']`
 * (`packages/connection/src/class-tracking.php`).
 *
 * The failure is silent by construction: `jetpackAnalytics.initialize()` is
 * simply skipped when the id is falsy, after which every `recordEvent` reports
 * nothing — no error, no warning, no failed build. In Tracks that is
 * indistinguishable from a screen nobody opened.
 *
 * A type cannot close this on its own, whatever the declaration happens to
 * allow. What reaches `initialize()` is server-provided JSON crossing an
 * untyped `@wordpress/data` store, so the value is only ever checked at
 * runtime; and even a declaration that rejects `Id` outright says nothing about
 * whether this hook passes the id on or drops it. These tests assert what
 * `initialize()` actually receives, which is the part no declaration reaches.
 *
 * So both directions of the spelling are pinned here: the first test fails if
 * the shared fixture stops carrying the key WordPress.com actually sends, the
 * second fails if this hook starts accepting one it does not.
 *
 * The rest guard the conditions around it — that an identity is not enough on
 * its own, that a half-formed one is refused, and that the effect keeps
 * tracking its inputs instead of firing once at mount. Each of those was a
 * mutation that survived the two spelling tests.
 */

const mockInitialize = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args: unknown[] ) => mockInitialize( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

// Imports must come after the jest.mock factory above.
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import useAnalytics from '../index';

/**
 * The connection store's bound selectors, the object `useConnection` reads through.
 *
 * `userConnectionData` has no reducer case, so the store takes it from the
 * initial state and never updates it. Spying on the selector is the only way to
 * hand the hook a different identity, and it is the pattern this package's
 * other connection tests already use.
 *
 * @return The bound selector object for the connection store.
 */
function connectionSelectors() {
	return select( CONNECTION_STORE_ID ) as unknown as {
		getUserConnectionData: () => unknown;
	};
}

/**
 * The connection store's bound actions.
 *
 * `dispatch()` is untyped for this store, so the one action used here is narrowed by hand.
 *
 * @return The bound action object for the connection store.
 */
function connectionActions() {
	return dispatch( CONNECTION_STORE_ID ) as unknown as {
		setConnectionStatus: ( status: Record< string, boolean > ) => void;
	};
}

beforeEach( () => {
	mockInitialize.mockClear();
	mockRecordEvent.mockClear();

	// The shared fixture declares no `connectionStatus`, so `isUserConnected`
	// defaults to false and the hook would skip `initialize()` for a reason
	// that has nothing to do with the key under test.
	connectionActions().setConnectionStatus( {
		isRegistered: true,
		isUserConnected: true,
		hasConnectedOwner: true,
	} );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

describe( 'useAnalytics', () => {
	it( 'identifies the reader with the id WordPress.com actually sends', () => {
		// No spy: this reads the identity straight out of the package's shared
		// jest fixture, through the real connection store, so the assertion
		// fails the moment that fixture stops spelling the key `ID`.
		renderHook( () => useAnalytics() );

		expect( mockInitialize ).toHaveBeenCalledWith( 99999, 'bobsacramento' );
	} );

	it( 'refuses a lowercase id rather than reporting a phantom reader', () => {
		// `Id` is the shape this package's own fixture used to assert.
		// WordPress.com never sends it, so accepting it would mean identifying
		// the reader as `undefined` and silently losing every later event.
		jest.spyOn( connectionSelectors(), 'getUserConnectionData' ).mockReturnValue( {
			currentUser: { wpcomUser: { Id: 99999, login: 'bobsacramento' } },
		} );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'refuses an identity that is missing the login', () => {
		// `initialize( ID, login )` takes both. Dropping `login` from the guard
		// would report the reader under an `undefined` username rather than not
		// reporting them at all, which is the worse of the two failures.
		jest.spyOn( connectionSelectors(), 'getUserConnectionData' ).mockReturnValue( {
			currentUser: { wpcomUser: { ID: 99999 } },
		} );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'does not identify anyone while the viewer is not a connected user', () => {
		// The identity is present and correctly spelled here — only the
		// connection is missing. Without this case the connection half of the
		// guard is never exercised, because every other test arrives connected.
		connectionActions().setConnectionStatus( { isUserConnected: false } );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'identifies the reader when the connection is confirmed after mount', () => {
		// `connectionStatus` is the part of this store that changes while the
		// page is mounted: `registerSite` yields one (`state/actions.jsx`), and
		// My Jetpack's own connection status card dispatches two more when the
		// reader unlinks or disconnects (`connection-status-card/index.tsx`).
		// `userConnectionData`, by contrast, has no reducer case at all, so the
		// identity itself cannot arrive late — the connection can.
		//
		// An effect that does not list its inputs fires once at mount, before
		// the guard can pass, and never runs again. The reader is then never
		// identified for the rest of the visit.
		connectionActions().setConnectionStatus( { isUserConnected: false } );

		renderHook( () => useAnalytics() );
		expect( mockInitialize ).not.toHaveBeenCalled();

		act( () => {
			connectionActions().setConnectionStatus( { isUserConnected: true } );
		} );

		expect( mockInitialize ).toHaveBeenCalledWith( 99999, 'bobsacramento' );
	} );
} );
