/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { mockRecordEvent } from '../../../../tests/js/dashboard-toolkit-test-utils';
import {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_STORE_ONBOARDING_KEY,
} from '../constants';
import { resetOnboardingForTesting, useOnboarding } from './use-onboarding';

jest.mock(
	'@jetpack-premium-analytics/widgets-toolkit',
	() =>
		jest.requireActual( '../../../../tests/js/dashboard-toolkit-test-utils' ).mockDashboardToolkit
);

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | null ) => void;
};

/**
 * Read a persisted completion date from the preferences store.
 *
 * @param key - The journey's preferences key.
 * @return The stored ISO date, or undefined before the journey completes.
 */
function storedCompletion( key = DASHBOARD_ONBOARDING_KEY ): string | undefined {
	return ( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		key
	);
}

/**
 * Write or clear a persisted completion date.
 *
 * @param value - ISO date to store, or null to clear it.
 * @param key   - The journey's preferences key.
 */
function setStoredCompletion( value: string | null, key = DASHBOARD_ONBOARDING_KEY ) {
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		key,
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
		resetOnboardingForTesting();
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		setStoredCompletion( null );
		setStoredCompletion( null, DASHBOARD_STORE_ONBOARDING_KEY );
	} );

	it( 'opens the modal on the first visit, marks it as seen and records the view', () => {
		const { result } = renderHook( () => useOnboarding( { enabled: true } ) );

		expect( result.current.phase ).toBe( 'modal' );
		expect( storedCompletion() ).toEqual( expect.any( String ) );
		expect( eventNames() ).toEqual( [ 'jetpack_premium_analytics_onboarding_view' ] );
	} );

	it( 'reads as open on the render the surface is ready, not a commit later', () => {
		const phases: string[] = [];

		renderHook( () => {
			const onboarding = useOnboarding( { enabled: true } );
			phases.push( onboarding.phase );
			return onboarding;
		} );

		// Whatever hides behind the journey would otherwise paint, and count, first.
		expect( phases[ 0 ] ).toBe( 'modal' );
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
		const { result } = renderHook( () =>
			useOnboarding( { enabled: true, stepCounts: { stats: 3 } } )
		);

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
			{ flow: 'stats', step: 3 }
		);
		expect( eventNames().at( -1 ) ).toBe( 'jetpack_premium_analytics_onboarding_finish' );
	} );

	it( 'records a dismissal with where the reader was', () => {
		const { result } = renderHook( () =>
			useOnboarding( { enabled: true, stepCounts: { stats: 3 } } )
		);

		act( () => result.current.start() );
		act( () => result.current.next() );
		act( () => result.current.dismiss( 'escape' ) );

		expect( result.current.phase ).toBe( 'closed' );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_onboarding_dismiss',
			{ flow: 'stats', phase: 'tour', step: 2, reason: 'escape' }
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

	const SEEN = '2026-09-01T10:00:00.000Z';

	it.each( [
		{ statsSeen: false, storeSeen: false, hasStoreSection: false, flow: 'stats' },
		{ statsSeen: false, storeSeen: false, hasStoreSection: true, flow: 'stats-and-store' },
		{ statsSeen: false, storeSeen: true, hasStoreSection: true, flow: 'stats-and-store' },
		{ statsSeen: true, storeSeen: false, hasStoreSection: true, flow: 'store' },
	] )(
		'opens $flow for stats seen $statsSeen, store seen $storeSeen, store tab $hasStoreSection',
		( { statsSeen, storeSeen, hasStoreSection, flow } ) => {
			setStoredCompletion( statsSeen ? SEEN : null );
			setStoredCompletion( storeSeen ? SEEN : null, DASHBOARD_STORE_ONBOARDING_KEY );

			const { result } = renderHook( () => useOnboarding( { enabled: true, hasStoreSection } ) );

			expect( result.current.phase ).toBe( 'modal' );
			expect( result.current.flow ).toBe( flow );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_onboarding_view', {
				flow,
			} );
		}
	);

	it.each( [
		{ storeSeen: false, hasStoreSection: false },
		{ storeSeen: true, hasStoreSection: true },
	] )(
		'stays closed once Stats is seen, store seen $storeSeen, store tab $hasStoreSection',
		( { storeSeen, hasStoreSection } ) => {
			setStoredCompletion( SEEN );
			setStoredCompletion( storeSeen ? SEEN : null, DASHBOARD_STORE_ONBOARDING_KEY );

			const { result } = renderHook( () => useOnboarding( { enabled: true, hasStoreSection } ) );

			expect( result.current.phase ).toBe( 'closed' );
		}
	);

	it( 'marks both journeys seen and keeps its flow and tour once the preferences land', () => {
		const { result } = renderHook( () =>
			useOnboarding( {
				enabled: true,
				hasStoreSection: true,
				stepCounts: { stats: 3, store: 1, 'stats-and-store': 4 },
			} )
		);

		expect( storedCompletion() ).toEqual( expect.any( String ) );
		expect( storedCompletion( DASHBOARD_STORE_ONBOARDING_KEY ) ).toEqual( expect.any( String ) );

		act( () => result.current.start() );
		act( () => result.current.next() );
		act( () => result.current.next() );
		act( () => result.current.next() );

		expect( result.current.flow ).toBe( 'stats-and-store' );
		expect( result.current.phase ).toBe( 'tour' );
		expect( result.current.step ).toBe( 3 );
	} );

	it( 'leaves the Stats journey unmarked when it only introduces the WooCommerce tab', () => {
		setStoredCompletion( SEEN );

		renderHook( () => useOnboarding( { enabled: true, hasStoreSection: true } ) );

		expect( storedCompletion() ).toBe( SEEN );
		expect( storedCompletion( DASHBOARD_STORE_ONBOARDING_KEY ) ).toEqual( expect.any( String ) );
	} );
} );
