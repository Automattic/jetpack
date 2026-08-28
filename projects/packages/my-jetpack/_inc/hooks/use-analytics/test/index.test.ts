/**
 * My Jetpack reports Tracks events under the reader's WordPress.com identity, which is
 * keyed `ID` — capital I, capital D. The failure is silent: `initialize()` is skipped
 * when the id is falsy, and every later `recordEvent` then reports nothing.
 *
 * A type cannot close this on its own — the value crosses an untyped `@wordpress/data`
 * store — so these assert what `initialize()` actually receives.
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
 * The connection store's bound selectors.
 *
 * `userConnectionData` has no reducer case, so spying on the selector is the only way to
 * hand the hook a different identity.
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

	// The shared fixture declares no `connectionStatus`, so the hook would otherwise skip
	// `initialize()` for a reason unrelated to the key under test.
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
		// No spy: reads the shared jest fixture through the real store, so this fails the
		// moment that fixture stops spelling the key `ID`.
		renderHook( () => useAnalytics() );

		expect( mockInitialize ).toHaveBeenCalledWith( 99999, 'bobsacramento' );
	} );

	it( 'refuses a lowercase id rather than reporting a phantom reader', () => {
		// The shape this package's fixture used to assert. WordPress.com never sends it, so
		// accepting it would identify the reader as `undefined` and lose every later event.
		jest.spyOn( connectionSelectors(), 'getUserConnectionData' ).mockReturnValue( {
			currentUser: { wpcomUser: { Id: 99999, login: 'bobsacramento' } },
		} );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'refuses an identity that is missing the login', () => {
		// `initialize( ID, login )` takes both, and reporting the reader under an
		// `undefined` username is worse than not reporting them at all.
		jest.spyOn( connectionSelectors(), 'getUserConnectionData' ).mockReturnValue( {
			currentUser: { wpcomUser: { ID: 99999 } },
		} );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'does not identify anyone while the viewer is not a connected user', () => {
		// A correctly spelled identity with no connection — the half of the guard every
		// other test arrives past.
		connectionActions().setConnectionStatus( { isUserConnected: false } );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'identifies the reader when the connection is confirmed after mount', () => {
		// `connectionStatus` is the part of this store that changes while mounted, so an
		// effect that does not list its inputs fires once before the guard can pass and
		// never identifies the reader again.
		connectionActions().setConnectionStatus( { isUserConnected: false } );

		renderHook( () => useAnalytics() );
		expect( mockInitialize ).not.toHaveBeenCalled();

		act( () => {
			connectionActions().setConnectionStatus( { isUserConnected: true } );
		} );

		expect( mockInitialize ).toHaveBeenCalledWith( 99999, 'bobsacramento' );
	} );
} );
