import { frameTimeToMs, END_GUARD_SECONDS } from '../select-frame-dialog';

describe( 'frameTimeToMs', () => {
	it( 'rounds seconds to whole milliseconds', () => {
		expect( frameTimeToMs( 4.2, 60 ) ).toBe( 4200 );
	} );

	it( 'clamps to >= 0', () => {
		expect( frameTimeToMs( -3, 60 ) ).toBe( 0 );
	} );

	it( 'clamps away from the very end of the video', () => {
		// 60s video: max allowed is 60 - 0.05 = 59.95s => 59950ms.
		expect( frameTimeToMs( 60, 60 ) ).toBe( ( 60 - END_GUARD_SECONDS ) * 1000 );
		expect( frameTimeToMs( 59.99, 60 ) ).toBe( ( 60 - END_GUARD_SECONDS ) * 1000 );
	} );

	it( 'handles a zero/empty duration without going negative', () => {
		expect( frameTimeToMs( 5, 0 ) ).toBe( 0 );
	} );
} );
