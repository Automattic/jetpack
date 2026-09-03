/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_ONBOARDING_KEY, DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { resetOnboardingForTesting, useOnboarding } from './use-onboarding';
import { resetTracksIdentityForTesting } from './use-track-event';

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: jest.fn(),
		identifyUser: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 42 } },
		user: { current_user: { wpcom: { ID: 7, login: 'reader' } } },
	} ),
} ) );

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | null ) => void;
};

/**
 * Read the persisted completion date from the preferences store.
 *
 * @return The stored ISO date, or undefined before the journey completes.
 */
function storedCompletion(): string | undefined {
	return ( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_ONBOARDING_KEY
	);
}

/**
 * Write or clear the persisted completion date.
 *
 * @param value - ISO date to store, or null to clear it.
 */
function setStoredCompletion( value: string | null ) {
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_ONBOARDING_KEY,
		value
	);
}

/**
 * The Tracks event names recorded so far, in order.
 *
 * @return Event names.
 */
function eventNames(): string[] {
	return mockRecordEvent.mock.calls.map( ( [ name ] ) => name as string );
}

describe( 'useOnboarding', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		resetTracksIdentityForTesting();
		resetOnboardingForTesting();
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		setStoredCompletion( null );
	} );

	it( 'opens the modal on the first visit, marks it as seen and records the view', () => {
		const { result } = renderHook( () => useOnboarding( { enabled: true } ) );

		expect( result.current.phase ).toBe( 'modal' );
		expect( storedCompletion() ).toEqual( expect.any( String ) );
		expect( eventNames() ).toEqual( [ 'jetpack_premium_analytics_onboarding_view' ] );
	} );

	it( 'stays closed for a reader who already completed it', () => {
		setStoredCompletion( '2026-09-01T10:00:00.000Z' );

		const { result } = renderHook( () => useOnboarding( { enabled: true } ) );

		expect( result.current.phase ).toBe( 'closed' );
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'waits until the surface is ready', () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useOnboarding( { enabled } ), {
			initialProps: { enabled: false },
		} );

		expect( result.current.phase ).toBe( 'closed' );

		rerender( { enabled: true } );
		expect( result.current.phase ).toBe( 'modal' );
	} );

	it( 'finishes at Get started when there is no tour', () => {
		const { result } = renderHook( () => useOnboarding( { enabled: true } ) );

		act( () => result.current.start() );

		expect( result.current.phase ).toBe( 'closed' );
		expect( eventNames() ).toEqual( [
			'jetpack_premium_analytics_onboarding_view',
			'jetpack_premium_analytics_onboarding_start',
			'jetpack_premium_analytics_onboarding_finish',
		] );
	} );

	it( 'walks the tour steps and finishes on the last one', () => {
		const { result } = renderHook( () => useOnboarding( { enabled: true, stepCount: 3 } ) );

		act( () => result.current.start() );
		expect( result.current.phase ).toBe( 'tour' );
		expect( result.current.step ).toBe( 0 );

		act( () => result.current.next() );
		act( () => result.current.next() );
		expect( result.current.step ).toBe( 2 );
		expect( result.current.phase ).toBe( 'tour' );

		act( () => result.current.next() );
		expect( result.current.phase ).toBe( 'closed' );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_onboarding_step_view',
			{ step: 3 }
		);
		expect( eventNames().at( -1 ) ).toBe( 'jetpack_premium_analytics_onboarding_finish' );
	} );

	it( 'records a dismissal with where the reader was', () => {
		const { result } = renderHook( () => useOnboarding( { enabled: true, stepCount: 3 } ) );

		act( () => result.current.start() );
		act( () => result.current.next() );
		act( () => result.current.dismiss() );

		expect( result.current.phase ).toBe( 'closed' );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_onboarding_dismiss',
			{ phase: 'tour', step: 2 }
		);
	} );

	it( 'does not reopen when the dashboard remounts before the preference lands', () => {
		const { result, unmount } = renderHook( () => useOnboarding( { enabled: true } ) );
		expect( result.current.phase ).toBe( 'modal' );

		act( () => result.current.dismiss() );
		unmount();
		// The remount sees no preference yet, the way a slow save would look.
		setStoredCompletion( null );

		const { result: remounted } = renderHook( () => useOnboarding( { enabled: true } ) );
		expect( remounted.current.phase ).toBe( 'closed' );
	} );

	it( 'does not reopen within the same page load once completed', () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useOnboarding( { enabled } ), {
			initialProps: { enabled: true },
		} );

		act( () => result.current.dismiss() );
		rerender( { enabled: false } );
		rerender( { enabled: true } );

		expect( result.current.phase ).toBe( 'closed' );
		expect( eventNames().filter( name => name.endsWith( '_view' ) ) ).toHaveLength( 1 );
	} );
} );
