/**
 * My Jetpack reports its Tracks events under the reader's WordPress.com
 * identity, and that identity is keyed `ID` — capital I, capital D.
 * `Connection\Manager::get_connected_user_data()` returns the WordPress.com
 * response verbatim and `REST_Connector::get_user_connection_data()` passes it
 * through untouched as `wpcomUser`, so the key is whichever one WordPress.com
 * sent; the PHP Tracks path reads that same array as `$wpcom_user_data['ID']`
 * (`packages/connection/src/class-tracking.php`).
 *
 * Nothing else guards the spelling. `WpcomUser` carries an index signature, so
 * a misspelled key still typechecks, and `jetpackAnalytics.initialize()` is
 * simply skipped when the id is falsy — every later `recordEvent` then reports
 * nothing, with no error, no warning and no failed build. In Tracks that is
 * indistinguishable from a screen nobody opened.
 *
 * So both directions are pinned here: the first test fails if the shared
 * fixture stops carrying the key WordPress.com actually sends, the second
 * fails if this hook starts accepting one it does not.
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
import { renderHook } from '@testing-library/react';
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
} );
