/**
 * External dependencies
 */
import chai from 'chai';
import child_process from 'child_process';

const testHelp = child_process.execFileSync(
	'node',
	[ './tools/cli/bin/jetpack', 'build', '--help' ],
	{ encoding: 'utf8' }
);

describe( 'build command', function () {
	it( 'production flag exists', () => {
		chai.expect( testHelp ).to.contain( '--production' ).and.contain( '-p,' ); // Need trailing comma since --production contains -p :)
	} );
} );
