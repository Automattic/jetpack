import { isWanted } from '../lib';

describe( 'What the wizard asks for', () => {
	// The switch and the request read this same function. When they each had their
	// own default they disagreed, and the finish screen under-reported by one.
	it( 'wants every module the user has not touched, however the site has it', () => {
		expect( isWanted( {}, 'monitor' ) ).toBe( true );
		expect( isWanted( {}, 'stats' ) ).toBe( true );
	} );

	it( 'wants what the user moved a switch to', () => {
		expect( isWanted( { monitor: false }, 'monitor' ) ).toBe( false );
		expect( isWanted( { monitor: false }, 'stats' ) ).toBe( true );
	} );
} );
