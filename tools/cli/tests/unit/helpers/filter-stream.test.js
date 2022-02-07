/**
 * External dependencies
 */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { once } from 'events';
import { promisify } from 'util';

/**
 * Internal dependencies
 */
import FilterStream from '../../../helpers/filter-stream.js';

chai.use( chaiAsPromised );

describe( 'FilterStream', () => {
	it( 'transforms', async () => {
		const ts = new FilterStream( s => s.toUpperCase(), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\n' );
		chai.expect( ts.read() ).to.equal( 'LINE 1\n' );
		await ts.pwrite( 'line 2...' );
		chai.expect( ts.read() ).to.equal( null );
		await ts.pwrite( ' ... done\n' );
		chai.expect( ts.read() ).to.equal( 'LINE 2... ... DONE\n' );
		await ts.pwrite( 'line 3\nline 4\n\nline 5\n' );
		chai.expect( ts.read() ).to.equal( 'LINE 3\nLINE 4\n\nLINE 5\n' );
		await ts.pwrite( '\nline 6\n' );
		chai.expect( ts.read() ).to.equal( '\nLINE 6\n' );
		await ts.pwrite( 'line 7\nline 8' );
		chai.expect( ts.read() ).to.equal( 'LINE 7\n' );
		await ts.pwrite( '...\nline 9' );
		chai.expect( ts.read() ).to.equal( 'LINE 8...\n' );
		await ts.pend();
		chai.expect( ts.read() ).to.equal( 'LINE 9' );
	} );

	it( 'filters', async () => {
		const ts = new FilterStream( s => ( s.match( /\d/ ) ? s : null ), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\nnope\nno\nline 2\nline 3' );
		await ts.pend();
		chai.expect( ts.read() ).to.equal( 'line 1\nline 2\nline 3' );
	} );

	it( 'filters (2)', async () => {
		const ts = new FilterStream( s => ( s.match( /\d/ ) ? s : null ), { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'nope\nno\nnot this either' );
		await ts.pend();
		chai.expect( ts.read() ).to.equal( null );
	} );

	it( "doesn't produce a stray line if EOF is a newline", async () => {
		const ts = new FilterStream( s => `<${ s }>`, { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pwrite( 'line 1\n' );
		await ts.pend();
		chai.expect( ts.read() ).to.equal( '<line 1>\n' );
	} );

	it( "doesn't produce a stray line if nothing was written", async () => {
		const ts = new FilterStream( s => `<${ s }>`, { encoding: 'utf8' } );
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		await ts.pend();
		chai.expect( ts.read() ).to.equal( null );
	} );

	it( "doesn't die from backpressure", async () => {
		const ts = new FilterStream( s => s.toUpperCase(), {
			encoding: 'utf8',
			highWaterMark: 100,
		} );

		let drains = 0;
		let n = 0;
		let expect = '';
		let actual = '';
		while ( drains < 2 ) {
			expect += `LINE ${ ++n }...\n`;
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
		chai.expect( actual ).to.equal( expect );
	} );

	it( "doesn't die from backpressure (2)", async () => {
		const ts = new FilterStream( s => s.toUpperCase(), {
			encoding: 'utf8',
			highWaterMark: 100,
		} );

		let n = 0;
		let expect = '';
		do {
			expect += `LINE ${ ++n }...\n`;
		} while ( ts.write( `line ${ n }...\n` ) !== false );
		ts.end( 'end' );
		expect += `END`;

		let actual = '';
		let chunk;
		while ( ( chunk = ts.read() ) !== null ) {
			actual += chunk;
		}
		chai.expect( actual ).to.equal( expect );
	} );

	it( 'handles filter errors', async () => {
		const ts = new FilterStream(
			() => {
				throw new Error( 'nope!' );
			},
			{ encoding: 'utf8' }
		);
		ts.pwrite = promisify( ts.write );
		ts.pend = promisify( ts.end );

		const errorEvent = once( ts, 'error' );

		await chai.expect( ts.pwrite( 'line 1\n' ) ).to.eventually.be.rejectedWith( 'nope!' );
		await chai
			.expect( errorEvent )
			.to.eventually.be.an( 'array' )
			.with.lengthOf( 1 )
			.with.property( 0 )
			.is.an( 'error' )
			.with.property( 'message', 'nope!' );
	} );

	it( 'handles filter errors (2)', async () => {
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
		// For some reason the end() callback is never called when there's an error. Only the error event.
		ts.end( () => chai.expect.fail( 'Expected end callback to never be called' ) );
		await chai
			.expect( errorEvent )
			.to.eventually.be.an( 'array' )
			.with.lengthOf( 1 )
			.with.property( 0 )
			.is.an( 'error' )
			.with.property( 'message', 'nope!' );
	} );
} );
