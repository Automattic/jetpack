import { isWanted } from '../lib';

describe( 'What the wizard asks for', () => {
	const off = { slug: 'monitor', activated: false };
	const on = { slug: 'stats', activated: true };

	// The switch and the request read this same function, so they cannot disagree.
	it( 'keeps what the site has for a module the user has not touched', () => {
		expect( isWanted( {}, off ) ).toBe( false );
		expect( isWanted( {}, on ) ).toBe( true );
	} );

	it( 'wants what the user moved a switch to', () => {
		expect( isWanted( { monitor: true }, off ) ).toBe( true );
		expect( isWanted( { monitor: true }, on ) ).toBe( true );
		expect( isWanted( { stats: false }, on ) ).toBe( false );
	} );

	it( 'never moves a module the host forces', () => {
		expect( isWanted( { monitor: true }, { ...off, locked: true } ) ).toBe( false );
	} );
} );
