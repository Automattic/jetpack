/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import PrefixTransformStream from '../../../helpers/prefix-stream.js';

it( 'prefixes', async () => {
	const ts = new PrefixTransformStream( { prefix: 'foobar', encoding: 'utf8' } );

	ts.write( 'line 1\n' );
	chai.expect( ts.read() ).to.equal( '[foobar] line 1\n' );
	ts.write( 'line 2...' );
	chai.expect( ts.read() ).to.equal( null );
	ts.write( ' ... done\n' );
	chai.expect( ts.read() ).to.equal( '[foobar] line 2... ... done\n' );
	ts.write( 'line 3\nline 4\nline 5\n' );
	chai.expect( ts.read() ).to.equal( '[foobar] line 3\n[foobar] line 4\n[foobar] line 5\n' );
	ts.write( 'line 6\nline 7' );
	chai.expect( ts.read() ).to.equal( '[foobar] line 6\n' );
	ts.write( '...\nline 8' );
	chai.expect( ts.read() ).to.equal( '[foobar] line 7...\n' );
	ts.end();
	chai.expect( ts.read() ).to.equal( '[foobar] line 8' );
} );

it( "doesn't produce a stray prefix if EOF is a newline", async () => {
	const ts = new PrefixTransformStream( { prefix: 'foobar', encoding: 'utf8' } );

	ts.write( 'line 1\n' );
	ts.end();
	chai.expect( ts.read() ).to.equal( '[foobar] line 1\n' );
} );

it( "doesn't produce a stray prefix if nothing was written", async () => {
	const ts = new PrefixTransformStream( { prefix: 'foobar', encoding: 'utf8' } );

	ts.end();
	chai.expect( ts.read() ).to.equal( null );
} );

it( 'prefixes with timing info', async () => {
	const ts = new PrefixTransformStream( { prefix: 'foobar', encoding: 'utf8', time: true } );

	ts.write( 'line 1\nline 2' );
	chai.expect( ts.read() ).to.match( /^\[foobar 0\.0\d\d\] line 1\n$/ );
	await new Promise( r => {
		setTimeout( r, 100 );
	} );
	ts.end();
	chai.expect( ts.read() ).to.match( /^\[foobar 0\.1\d\d\] line 2$/ );
} );

it( 'prefixes with timing info but no prefix', async () => {
	const ts = new PrefixTransformStream( { encoding: 'utf8', time: Date.now() - 3723000 } );

	ts.write( 'line 1\n' );
	chai.expect( ts.read() ).to.match( /^\[1:02:03\.0\d\d\] line 1\n$/ );
} );

it( "doesn't prefix with no timing info and no prefix", async () => {
	const ts = new PrefixTransformStream( { encoding: 'utf8' } );

	ts.write( 'line 1\n' );
	chai.expect( ts.read() ).to.equal( 'line 1\n' );
} );

it( "doesn't die from backpressure", async () => {
	const ts = new PrefixTransformStream( {
		prefix: 'foobar',
		encoding: 'utf8',
		highWaterMark: 100,
	} );

	let drains = 0;
	let n = 0;
	let expect = '';
	let actual = '';
	while ( drains < 2 ) {
		expect += `[foobar] line ${ ++n }...\n`;
		if ( ts.write( `line ${ n }...\n` ) === false ) {
			drains++;
			actual += ts.read();
		}
	}
	ts.end();
	actual += ts.read();
	chai.expect( actual ).to.equal( expect );
} );

it( "doesn't die from backpressure (2)", async () => {
	const ts = new PrefixTransformStream( {
		prefix: 'foobar',
		encoding: 'utf8',
		highWaterMark: 100,
	} );

	let n = 0;
	let expect = '';
	do {
		expect += `[foobar] line ${ ++n }...\n`;
	} while ( ts.write( `line ${ n }...\n` ) !== false );
	ts.end( 'end' );
	expect += `[foobar] end`;

	let actual = '';
	let chunk;
	while ( ( chunk = ts.read() ) !== null ) {
		actual += chunk;
	}
	chai.expect( actual ).to.equal( expect );
} );
