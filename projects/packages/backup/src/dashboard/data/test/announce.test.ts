jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

// Imports must come after the jest.mock factory above.
import { speak } from '@wordpress/a11y';
import { ANNOUNCE_WINDOW_MS, announce } from '../announce';

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

	it( 'lets a newer message replace one its source left waiting', () => {
		announce( 'Load failed. Service unavailable', 'assertive', 'notice' );
		announce( 'Load failed. Timed out', 'assertive', 'notice' );
		jest.advanceTimersByTime( ANNOUNCE_WINDOW_MS );

		expect( speak ).toHaveBeenCalledWith( 'Load failed. Timed out', 'assertive' );
	} );
} );
