/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_FEEDBACK_BANNER_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../constants';
import { resetFeedbackBannerForTesting, useFeedbackBanner } from './use-feedback-banner';

const mockRecordEvent = jest.fn();

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => mockRecordEvent,
} ) );

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | null ) => void;
};

/**
 * Read the persisted close date from the preferences store.
 *
 * @return The stored ISO date, or undefined while the banner still stands.
 */
function storedClosure(): string | undefined {
	return ( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_FEEDBACK_BANNER_KEY
	);
}

/**
 * Write or clear the persisted close date.
 *
 * @param value - ISO date to store, or null to clear it.
 */
function setStoredClosure( value: string | null ) {
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_FEEDBACK_BANNER_KEY,
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

describe( 'useFeedbackBanner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		resetFeedbackBannerForTesting();
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		setStoredClosure( null );
	} );

	it( 'stands on the first visit and records the view', () => {
		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		expect( result.current.isVisible ).toBe( true );
		expect( storedClosure() ).toBeFalsy();
		expect( eventNames() ).toEqual( [ 'jetpack_premium_analytics_feedback_banner_view' ] );
	} );

	it( 'stays closed for a reader who already closed it', () => {
		setStoredClosure( '2026-09-01T10:00:00.000Z' );

		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		expect( result.current.isVisible ).toBe( false );
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'waits until the surface is ready', () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useFeedbackBanner( { enabled } ), {
			initialProps: { enabled: false },
		} );

		expect( result.current.isVisible ).toBe( false );
		expect( mockRecordEvent ).not.toHaveBeenCalled();

		rerender( { enabled: true } );
		expect( result.current.isVisible ).toBe( true );
	} );

	it( 'keeps standing behind the modal it opened, and names the entry point', () => {
		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		act( () => result.current.open() );

		expect( result.current.isFeedbackOpen ).toBe( true );
		expect( result.current.isVisible ).toBe( true );
		expect( storedClosure() ).toBeFalsy();
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_feedback_open', {
			source: 'banner',
		} );
	} );

	it( 'is still there for a reader who backs out of the modal', () => {
		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		act( () => result.current.open() );
		act( () => result.current.close() );

		expect( result.current.isFeedbackOpen ).toBe( false );
		expect( result.current.isVisible ).toBe( true );
		expect( storedClosure() ).toBeFalsy();
	} );

	it( 'goes for good once the answer is on its way', () => {
		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		act( () => result.current.open() );
		act( () => result.current.complete() );

		expect( result.current.isVisible ).toBe( false );
		expect( storedClosure() ).toEqual( expect.any( String ) );
	} );

	it( 'records a dismissal and persists it', () => {
		const { result } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		act( () => result.current.dismiss() );

		expect( result.current.isVisible ).toBe( false );
		expect( storedClosure() ).toEqual( expect.any( String ) );
		expect( eventNames().at( -1 ) ).toBe( 'jetpack_premium_analytics_feedback_banner_dismiss' );
	} );

	it( 'does not come back when the dashboard remounts before the preference lands', () => {
		const { result, unmount } = renderHook( () => useFeedbackBanner( { enabled: true } ) );

		act( () => result.current.dismiss() );
		unmount();
		// The remount sees no preference yet, the way a slow save would look.
		setStoredClosure( null );

		const { result: remounted } = renderHook( () => useFeedbackBanner( { enabled: true } ) );
		expect( remounted.current.isVisible ).toBe( false );
	} );

	it( 'records one view per page load however often the surface comes and goes', () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useFeedbackBanner( { enabled } ), {
			initialProps: { enabled: true },
		} );

		rerender( { enabled: false } );
		rerender( { enabled: true } );

		expect( result.current.isVisible ).toBe( true );
		expect( eventNames() ).toEqual( [ 'jetpack_premium_analytics_feedback_banner_view' ] );
	} );
} );
