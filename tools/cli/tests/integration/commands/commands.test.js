import { fileURLToPath } from 'url';
import execa from 'execa';

const { stdout: help } = await execa(
	fileURLToPath( new URL( '../../../bin/jetpack.js', import.meta.url ) ),
	[ '--help' ],
	{
		encoding: 'utf8',
	}
);

describe( 'verify commands are available', () => {
	test( 'build command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack build [project...]' ) );
	} );
	test( 'changelog command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack changelog [cmd]' ) );
	} );
	test( 'cli command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack cli <cmd>' ) );
	} );
	test( 'docker command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack docker <cmd>' ) );
	} );
	test( 'generate command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack generate [type]' ) );
	} );
	test( 'install command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack install [project...]' ) );
	} );
	test( 'watch command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack watch [project]' ) );
	} );
	test( 'completion command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack completion' ) );
	} );
	test( 'draft command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack draft <cmd>' ) );
	} );
} );
