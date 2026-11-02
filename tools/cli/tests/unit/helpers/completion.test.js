import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import {
	completeProject,
	completionHook,
	completionScript,
	parsePositionals,
	positionalFor,
	shellFromEnv,
} from '../../../helpers/completion.js';

const oldCwd = process.cwd();
const oldShell = process.env.SHELL;
beforeAll( () => process.chdir( fileURLToPath( new URL( '../../../../../', import.meta.url ) ) ) );
afterEach( () => {
	process.env.SHELL = oldShell;
} );
afterAll( () => process.chdir( oldCwd ) );

describe( 'parsePositionals', () => {
	test.each( [
		[ 'build [project...]', [ { name: 'project', variadic: true } ] ],
		[
			'clean [project] [include]',
			[
				{ name: 'project', variadic: false },
				{ name: 'include', variadic: false },
			],
		],
		[ 'docker <cmd>', [ { name: 'cmd', variadic: false } ] ],
		[ 'completion', [] ],
	] )( '%s', ( command, expected ) => {
		expect( parsePositionals( command ) ).toEqual( expected );
	} );
} );

describe( 'positionalFor', () => {
	// `words` is argv._: the program name, the command words, then the positional words.
	test.each( [
		[ 'first positional', 'clean [project] [include]', [ 'jetpack', 'clean', '' ], 1, 'project' ],
		[
			'second positional',
			'clean [project] [include]',
			[ 'jetpack', 'clean', 'plugins/jetpack', 'u' ],
			1,
			'include',
		],
		[
			'past the last positional',
			'clean [project] [include]',
			[ 'jetpack', 'clean', 'a', 'b', '' ],
			1,
			undefined,
		],
		[
			'variadic takes the rest',
			'build [project...]',
			[ 'jetpack', 'build', 'a', 'b', '' ],
			1,
			'project',
		],
		[ 'nested command', 'add [project]', [ 'jetpack', 'changelog', 'add', '' ], 2, 'project' ],
		[ 'the command word itself', 'build [project...]', [ 'jetpack', 'build' ], 1, undefined ],
	] )( '%s', ( _, command, words, depth, expected ) => {
		expect( positionalFor( command, words, depth )?.name ).toBe( expected );
	} );
} );

describe( 'completeProject', () => {
	test( 'offers the project types until a slash is typed', () => {
		expect( completeProject( 'pa' ) ).toEqual( [
			'github-actions/',
			'js-packages/',
			'packages/',
			'plugins/',
		] );
	} );
	test( 'offers the projects of the typed type', () => {
		expect( completeProject( 'plugins/jet' ) ).toContain( 'plugins/jetpack' );
		expect( completeProject( 'plugins/jet' ) ).not.toContain( 'packages/connection' );
	} );
	test( 'offers nothing for an unknown type', () => {
		expect( completeProject( 'nope/' ) ).toEqual( [] );
	} );
} );

describe( 'completionHook', () => {
	const hook = ( commands, fullCommands, perCommand = {} ) =>
		completionHook(
			{ getInternalMethods: () => ( { getContext: () => ( { commands, fullCommands } ) } ) },
			perCommand
		);
	const run = ( fn, current, _, defaults = [ '--help' ] ) =>
		new Promise( resolve => fn( current, { _ }, cb => cb( null, defaults ), resolve ) );
	const build = hook( [ 'build' ], [ 'build [project...]' ] );

	test( 'keeps the yargs defaults and adds the positional candidates', async () => {
		await expect( run( build, '', [ 'jetpack', 'build', '' ] ) ).resolves.toEqual( [
			'--help',
			'github-actions/',
			'js-packages/',
			'packages/',
			'plugins/',
		] );
	} );
	test( 'filters by the typed prefix and skips projects already listed', async () => {
		const list = await run( build, 'plugins/', [
			'jetpack',
			'build',
			'plugins/jetpack',
			'plugins/',
		] );
		expect( list ).toContain( 'plugins/backup' );
		expect( list ).not.toContain( 'plugins/jetpack' );
		expect( list ).not.toContain( 'packages/connection' );
	} );
	test( 'keeps multi-line descriptions from yargs on one line', async () => {
		await expect(
			run( build, '', [ 'jetpack', 'build', '' ], [ 'x:First line.\n\nSecond line.' ] )
		).resolves.toEqual( [
			'x:First line. Second line.',
			'github-actions/',
			'js-packages/',
			'packages/',
			'plugins/',
		] );
	} );
	test( 'leaves options to yargs', async () => {
		await expect( run( build, '--', [ 'jetpack', 'build' ] ) ).resolves.toEqual( [ '--help' ] );
	} );
	test( 'does nothing outside a command', async () => {
		await expect( run( hook( [], [] ), 'bu', [ 'jetpack', 'bu' ] ) ).resolves.toEqual( [
			'--help',
		] );
	} );
	test( 'rejects an async completer, which would let yargs run the half-typed command', async () => {
		const error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		const rsync = hook( [ 'rsync' ], [ 'rsync [plugin] [dest]' ], {
			rsync: { dest: async () => [ 'site' ] },
		} );
		await expect( run( rsync, 's', [ 'jetpack', 'rsync', 'jetpack', 's' ] ) ).resolves.toEqual( [
			'--help',
		] );
		expect( error ).toHaveBeenCalledWith( expect.any( TypeError ) );
		error.mockRestore();
	} );
	test( "prefers the command's own completer and escapes colons for zsh", async () => {
		process.env.SHELL = '/bin/zsh';
		const rsync = hook( [ 'rsync' ], [ 'rsync [plugin] [dest]' ], {
			rsync: { dest: () => [ 'site:a', 'other' ] },
		} );
		await expect( run( rsync, 's', [ 'jetpack', 'rsync', 'jetpack', 's' ] ) ).resolves.toEqual( [
			'--help',
			'site\\:a',
		] );
	} );
} );

describe( 'shellFromEnv', () => {
	test.each( [
		[ '/bin/zsh', 'zsh' ],
		[ '/opt/homebrew/bin/bash', 'bash' ],
		[ '/usr/bin/fish', undefined ],
		[ undefined, undefined ],
	] )( '%s', ( shell, expected ) => {
		if ( shell === undefined ) {
			delete process.env.SHELL;
		} else {
			process.env.SHELL = shell;
		}
		expect( shellFromEnv() ).toBe( expected );
	} );
} );

describe( 'completionScript', () => {
	test( 'names the command in the zsh script', () => {
		const script = completionScript( 'zsh', 'jp' );
		expect( script ).toMatch( /^#compdef jp\n/ );
		expect( script ).toContain( 'jp --get-yargs-completions' );
		expect( script ).toContain( 'compdef _jp jp' );
		expect( script ).not.toContain( '{{' );
	} );
	test( 'names the command in the bash script', () => {
		const script = completionScript( 'bash', 'jp' );
		expect( script ).toContain( 'complete -o bashdefault -o default -F _jp jp' );
		expect( script ).not.toContain( '{{' );
	} );
} );
