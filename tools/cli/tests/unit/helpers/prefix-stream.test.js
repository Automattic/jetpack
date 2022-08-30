import { jest } from '@jest/globals';
import PrefixStream from '../../../helpers/prefix-stream.js';

jest.useFakeTimers();

describe( 'PrefixStream', () => {
	test( 'prefixes', async () => {
		const ts = new PrefixStream( { prefix: 'foobar', encoding: 'utf8' } );

		ts.write( 'line 1\n\nline 2' );
		expect( ts.read() ).toBe( '[foobar] line 1\n[foobar] \n' );
		ts.end();
		expect( ts.read() ).toBe( '[foobar] line 2' );
	} );

	test( 'prefixes with timing info', async () => {
		const ts = new PrefixStream( { prefix: 'foobar', encoding: 'utf8', time: true } );

		ts.write( 'line 1\nline 2' );
		expect( ts.read() ).toMatch( /^\[foobar 0\.0\d\d\] line 1\n$/ );
		jest.advanceTimersByTime( 110 );
		ts.end();
		expect( ts.read() ).toMatch( /^\[foobar 0\.1\d\d\] line 2$/ );
	} );

	test( 'prefixes with timing info but no prefix', async () => {
		const ts = new PrefixStream( { encoding: 'utf8', time: Date.now() - 3723000 } );

		ts.write( 'line 1\n' );
		expect( ts.read() ).toMatch( /^\[1:02:03\.0\d\d\] line 1\n$/ );
	} );

	test( "doesn't prefix with no timing info and no prefix", async () => {
		const ts = new PrefixStream( { encoding: 'utf8' } );

		ts.write( 'line 1\n' );
		expect( ts.read() ).toBe( 'line 1\n' );
	} );
} );
