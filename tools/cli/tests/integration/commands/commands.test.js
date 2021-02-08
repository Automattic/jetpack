/**
 * External dependencies
 */
import chai from 'chai';
import child_process from 'child_process';

const test = child_process.execFileSync( 'node', [ './tools/cli/bin/jetpack', '--help' ], {
	encoding: 'utf8',
} );

describe( 'verify commands are available', function () {
	it( 'build command exists', () => {
		chai.expect( test ).to.contain( 'jetpack build [project]' );
	} );
	it( 'cli command exists', () => {
		chai.expect( test ).to.contain( 'jetpack cli <cmd>' );
	} );
	it( 'watch command exists', () => {
		chai.expect( test ).to.contain( 'jetpack watch [project]' );
	} );
	it( 'install command exists', () => {
		chai.expect( test ).to.contain( 'jetpack install [project]' );
	} );
} );
