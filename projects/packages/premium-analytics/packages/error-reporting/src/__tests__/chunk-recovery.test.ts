import { recoverFromChunkLoad } from '../chunk-recovery';
import { reloadPage } from '../reload-page';

jest.mock( '../reload-page', () => ( { reloadPage: jest.fn() } ) );

const ATTEMPT_KEY = 'jetpack-premium-analytics-chunk-retry';
const START = new Date( '2026-03-01T10:00:00Z' );
const MINUTE = 60_000;

describe( 'recoverFromChunkLoad', () => {
	let spies: jest.SpyInstance[] = [];

	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( START );
		window.sessionStorage.clear();
		jest.mocked( reloadPage ).mockReset();
	} );

	afterEach( () => {
		spies.forEach( spy => spy.mockRestore() );
		spies = [];
		jest.useRealTimers();
	} );

	it( 'reloads the tab and records the attempt', () => {
		recoverFromChunkLoad();

		expect( reloadPage ).toHaveBeenCalledTimes( 1 );
		expect( window.sessionStorage.getItem( ATTEMPT_KEY ) ).toBe( String( START.getTime() ) );
	} );

	it( 'does not reload again within a minute, so a failure a reload cannot fix cannot loop', () => {
		recoverFromChunkLoad();
		jest.advanceTimersByTime( MINUTE - 1 );
		recoverFromChunkLoad();

		expect( reloadPage ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reloads again a minute later, so one earlier failure does not disarm the tab', () => {
		recoverFromChunkLoad();
		jest.advanceTimersByTime( MINUTE );
		recoverFromChunkLoad();

		expect( reloadPage ).toHaveBeenCalledTimes( 2 );
	} );

	it.each( [
		[ 'an unreadable store', 'getItem' ],
		[ 'an unwritable store', 'setItem' ],
	] )( 'does not reload with %s, which leaves nothing to stop a loop', ( _label, method ) => {
		spies = [
			jest.spyOn( Storage.prototype, method as 'getItem' | 'setItem' ).mockImplementation( () => {
				throw new Error( 'denied' );
			} ),
		];

		recoverFromChunkLoad();

		expect( reloadPage ).not.toHaveBeenCalled();
	} );
} );
