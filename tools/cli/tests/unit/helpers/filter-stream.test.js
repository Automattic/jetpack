import { once } from 'events';
import { promisify } from 'util';
import { jest } from '@jest/globals';
import FilterStream from '../../../helpers/filter-stream.js';

describe( 'FilterStream', () => {
	test( 'transforms', async () => {
		const ts = new FilterStream( s => s.toUpperCase(), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\n' );
		expect( ts.read() ).toBe( 'LINE 1\n' );
		await ts.pwrite( 'line 2...' );
		expect( ts.read() ).toBeNull();
		await ts.pwrite( ' ... done\n' );
		expect( ts.read() ).toBe( 'LINE 2... ... DONE\n' );
		await ts.pwrite( 'line 3\nline 4\n\nline 5\n' );
		expect( ts.read() ).toBe( 'LINE 3\nLINE 4\n\nLINE 5\n' );
		await ts.pwrite( '\nline 6\n' );
		expect( ts.read() ).toBe( '\nLINE 6\n' );
		await ts.pwrite( 'line 7\nline 8' );
		expect( ts.read() ).toBe( 'LINE 7\n' );
		await ts.pwrite( '...\nline 9' );
		expect( ts.read() ).toBe( 'LINE 8...\n' );
		await ts.pend();
		expect( ts.read() ).toBe( 'LINE 9' );
	} );

	test( 'filters', async () => {
		const ts = new FilterStream( s => ( s.match( /\d/ ) ? s : null ), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\nnope\nno\nline 2\nline 3' );
		await ts.pend();
		expect( ts.read() ).toBe( 'line 1\nline 2\nline 3' );
	} );

	test( 'filters (2)', async () => {
		const ts = new FilterStream( s => ( s.match( /\d/ ) ? s : null ), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'nope\nno\nnot this either' );
		await ts.pend();
		expect( ts.read() ).toBeNull();
	} );

	test( "doesn't produce a stray line if EOF is a newline", async () => {
		const ts = new FilterStream( s => `<${ s }>`, { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\n' );
		await ts.pend();
		expect( ts.read() ).toBe( '<line 1>\n' );
	} );

	test( "doesn't produce a stray line if nothing was written", async () => {
		const ts = new FilterStream( s => `<${ s }>`, { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pend();
		expect( ts.read() ).toBeNull();
	} );

	test( "doesn't die from backpressure", async () => {
		const ts = new FilterStream( s => s.toUpperCase(), {
			encoding: 'utf8',
			highWaterMark: 100,
		} );

		let drains = 0;
		let n = 0;
		let xpect = '';
		let actual = '';
		while ( drains < 2 ) {
			xpect += `LINE ${ ++n }...\n`;
			if ( ts.write( `line ${ n }...\n` ) === false ) {
				drains++;
				actual += ts.read();
			}
		}
		ts.end();
		let chunk;
		while ( ( chunk = ts.read() ) !== null ) {
			actual += chunk;
		}
		expect( actual ).toEqual( xpect );
	} );

	test( "doesn't die from backpressure (2)", async () => {
		const ts = new FilterStream( s => s.toUpperCase(), {
			encoding: 'utf8',
			highWaterMark: 100,
		} );

		let n = 0;
		let xpect = '';
		do {
			xpect += `LINE ${ ++n }...\n`;
		} while ( ts.write( `line ${ n }...\n` ) !== false );
		ts.end( 'end' );
		xpect += `END`;

		let actual = '';
		let chunk;
		while ( ( chunk = ts.read() ) !== null ) {
			actual += chunk;
		}
		expect( actual ).toEqual( xpect );
	} );

	test( 'handles filter errors', async () => {
		const ts = new FilterStream(
			() => {
				throw new Error( 'nope!' );
			},
			{ encoding: 'utf8' }
		);
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		const errorEvent = once( ts, 'error' );

		await expect( ts.pwrite( 'line 1\n' ) ).rejects.toThrow( 'nope!' );
		await expect( errorEvent ).resolves.toEqual( [ new Error( 'nope!' ) ] );
	} );

	test( 'handles filter errors (2)', async () => {
		const ts = new FilterStream(
			() => {
				throw new Error( 'nope!' );
			},
			{ encoding: 'utf8' }
		);
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		const errorEvent = once( ts, 'error' );
		await ts.pwrite( 'line 1' );
		const endfn = jest.fn();
		ts.end( endfn );
		await expect( errorEvent ).resolves.toEqual( [ new Error( 'nope!' ) ] );
		// For some reason the end() callback is never called when there's an error. Only the error event.
		expect( endfn ).not.toHaveBeenCalled();
	} );
} );
