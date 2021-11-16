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
	it( 'changelog command exists', () => {
		chai.expect( test ).to.contain( 'jetpack changelog [cmd]' );
	} );
	it( 'cli command exists', () => {
		chai.expect( test ).to.contain( 'jetpack cli <cmd>' );
	} );
	it( 'docker command exists', () => {
		chai.expect( test ).to.contain( 'jetpack docker <cmd>' );
	} );
	it( 'generate command exists', () => {
		chai.expect( test ).to.contain( 'jetpack generate [type]' );
	} );
	it( 'install command exists', () => {
		chai.expect( test ).to.contain( 'jetpack install [project]' );
	} );
	it( 'watch command exists', () => {
		chai.expect( test ).to.contain( 'jetpack watch [project]' );
	} );
	it( 'completion command exists', () => {
		chai.expect( test ).to.contain( 'jetpack completion' );
	} );
	it( 'draft command exists', () => {
		chai.expect( test ).to.contain( 'jetpack draft <cmd>' );
	} );
} );
