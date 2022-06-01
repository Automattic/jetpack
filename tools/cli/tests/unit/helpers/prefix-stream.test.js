import chai from 'chai';
import PrefixStream from '../../../helpers/prefix-stream.js';

describe( 'PrefixStream', () => {
	it( 'prefixes', async () => {
		const ts = new PrefixStream( { prefix: 'foobar', encoding: 'utf8' } );

		ts.write( 'line 1\n\nline 2' );
		chai.expect( ts.read() ).to.equal( '[foobar] line 1\n[foobar] \n' );
		ts.end();
		chai.expect( ts.read() ).to.equal( '[foobar] line 2' );
	} );

	it( 'prefixes with timing info', async () => {
		const ts = new PrefixStream( { prefix: 'foobar', encoding: 'utf8', time: true } );

		ts.write( 'line 1\nline 2' );
		chai.expect( ts.read() ).to.match( /^\[foobar 0\.0\d\d\] line 1\n$/ );
		await new Promise( r => {
			setTimeout( r, 110 );
		} );
		ts.end();
		chai.expect( ts.read() ).to.match( /^\[foobar 0\.1\d\d\] line 2$/ );
	} );

	it( 'prefixes with timing info but no prefix', async () => {
		const ts = new PrefixStream( { encoding: 'utf8', time: Date.now() - 3723000 } );

		ts.write( 'line 1\n' );
		chai.expect( ts.read() ).to.match( /^\[1:02:03\.0\d\d\] line 1\n$/ );
	} );

	it( "doesn't prefix with no timing info and no prefix", async () => {
		const ts = new PrefixStream( { encoding: 'utf8' } );

		ts.write( 'line 1\n' );
		chai.expect( ts.read() ).to.equal( 'line 1\n' );
	} );
} );
