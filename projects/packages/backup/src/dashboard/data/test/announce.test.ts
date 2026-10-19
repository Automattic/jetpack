jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

// Imports must come after the jest.mock factory above.
import { speak } from '@wordpress/a11y';
import { ANNOUNCE_WINDOW_MS, announce, cancelAnnouncement } from '../announce';

beforeEach( () => {
	jest.useFakeTimers();
	( speak as jest.Mock ).mockClear();
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'announce', () => {
	it( 'speaks messages from one window once, assertive if any of them was', () => {
		announce( "We couldn't load your site's activity.", 'assertive' );
		announce( 'Your backup is ready.' );
		jest.advanceTimersByTime( ANNOUNCE_WINDOW_MS );

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith(
			"We couldn't load your site's activity. Your backup is ready.",
			'assertive'
		);
	} );

	it( 'lets a newer message replace one its source left waiting, in arrival order', () => {
		announce( 'Load failed. Service unavailable', 'assertive', 'notice' );
		announce( 'Your backup is ready.' );
		announce( 'Load failed. Timed out', 'assertive', 'notice' );
		jest.advanceTimersByTime( ANNOUNCE_WINDOW_MS );

		expect( speak ).toHaveBeenCalledWith(
			'Your backup is ready. Load failed. Timed out',
			'assertive'
		);
	} );

	it( 'drops a withdrawn message and its urgency, and speaks the rest', () => {
		announce( "We couldn't load this backup's files.", 'assertive', 'notice' );
		announce( 'Your backup is ready.' );
		cancelAnnouncement( 'notice' );
		jest.advanceTimersByTime( ANNOUNCE_WINDOW_MS );

		expect( ( speak as jest.Mock ).mock.calls ).toEqual( [
			[ 'Your backup is ready.', 'polite' ],
		] );
	} );
} );
