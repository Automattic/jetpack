import { fileURLToPath } from 'url';
import { execa } from 'execa';

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
	test( 'clean command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack clean [project] [include]' ) );
	} );
	test( 'cli command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack cli <cmd>' ) );
	} );
	test( 'composer command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack composer' ) );
	} );
	test( 'completion command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack completion' ) );
	} );
	test( 'dependencies command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack dependencies <subcommand>' ) );
	} );
	test( 'docker command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack docker <cmd>' ) );
	} );
	test( 'docs command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack docs [path] [dest]' ) );
	} );
	test( 'draft command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack draft <cmd>' ) );
	} );
	test( 'generate command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack generate [type]' ) );
	} );
	test( 'install command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack install [project...]' ) );
	} );
	test( 'phan command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack phan [project...]' ) );
	} );
	test( 'pnpm command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack pnpm' ) );
	} );
	test( 'release command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack release [project] [script]' ) );
	} );
	test( 'rsync command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack rsync [plugin] [dest]' ) );
	} );
	test( 'command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack test [test] [project...]' ) );
	} );
	test( 'watch command exists', () => {
		expect( help ).toEqual( expect.stringContaining( 'jetpack watch [project]' ) );
	} );
} );
