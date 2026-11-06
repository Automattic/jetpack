import { PlayTracker } from '../tracker';

describe( 'PlayTracker', () => {
	it( 'records continuous playback as one segment', () => {
		const tracker = new PlayTracker();
		tracker.play();
		[ 0, 250, 500, 750, 1000 ].forEach( ms => tracker.time( ms ) );
		expect( tracker.take() ).toEqual( [ [ 0, 1000 ] ] );
	} );

	it( 'does not count a seek to the end as played', () => {
		const tracker = new PlayTracker();
		tracker.play();
		tracker.time( 0 );
		tracker.time( 500 );
		tracker.time( 59000 );
		tracker.time( 59500 );
		tracker.stop();
		expect( tracker.take() ).toEqual( [
			[ 0, 500 ],
			[ 59000, 59500 ],
		] );
	} );

	it( 'keeps an open segment going across takes', () => {
		const tracker = new PlayTracker();
		tracker.play();
		tracker.time( 1000 );
		tracker.time( 2000 );
		expect( tracker.take() ).toEqual( [ [ 1000, 2000 ] ] );
		tracker.time( 3000 );
		expect( tracker.take() ).toEqual( [ [ 2000, 3000 ] ] );
	} );

	it( 'ignores time updates while paused', () => {
		const tracker = new PlayTracker();
		tracker.time( 1000 );
		tracker.time( 2000 );
		expect( tracker.hasActivity() ).toBe( false );
	} );
} );
