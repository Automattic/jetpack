import { fileURLToPath } from 'url';
import { execa } from 'execa';

const bin = fileURLToPath( new URL( '../../../bin/jetpack.js', import.meta.url ) );

/**
 * Ask the CLI for completions the way the generated shell script does.
 *
 * @param {...string} words - The command line so far, the last word being the one completed.
 * @return {Promise<string[]>} Candidates.
 */
async function complete( ...words ) {
	const { stdout } = await execa( bin, [ '--get-yargs-completions', 'jetpack', ...words ], {
		encoding: 'utf8',
		env: { SHELL: '/bin/bash' },
	} );
	return stdout.split( '\n' );
}

describe( 'completion command', () => {
	test( 'prints the script for the requested shell', async () => {
		const { stdout } = await execa( bin, [ 'completion', 'zsh' ], { encoding: 'utf8' } );
		expect( stdout ).toMatch( /^#compdef jetpack\n/ );
	} );
	test( 'falls back to the login shell', async () => {
		const { stdout } = await execa( bin, [ 'completion' ], {
			encoding: 'utf8',
			env: { SHELL: '/bin/bash' },
		} );
		expect( stdout ).toContain( 'complete -o bashdefault -o default -F _jetpack jetpack' );
	} );
	test( 'refuses a shell it has no script for', async () => {
		await expect(
			execa( bin, [ 'completion' ], { encoding: 'utf8', env: { SHELL: '/usr/bin/fish' } } )
		).rejects.toMatchObject( { exitCode: 1 } );
	} );
	test( 'completes its own shell argument', async () => {
		await expect( complete( 'completion', '' ) ).resolves.toEqual(
			expect.arrayContaining( [ 'bash', 'zsh' ] )
		);
	} );
} );

describe( 'completion', () => {
	test( 'completes command names', async () => {
		await expect( complete( 'bu' ) ).resolves.toContain( 'build' );
	} );
	test( 'completes project types, then projects', async () => {
		await expect( complete( 'build', '' ) ).resolves.toEqual(
			expect.arrayContaining( [ '--all', 'packages/' ] )
		);
		await expect( complete( 'build', 'packages/conn' ) ).resolves.toContain(
			'packages/connection'
		);
	} );
	test( 'completes positionals of nested commands', async () => {
		await expect( complete( 'changelog', 'add', 'plugins/jet' ) ).resolves.toContain(
			'plugins/jetpack'
		);
		await expect( complete( 'docker', 'phpunit', '' ) ).resolves.toContain( 'jp-multisite' );
	} );
	test( "completes a command's own positionals", async () => {
		await expect( complete( 'phan', 'mono' ) ).resolves.toContain( 'monorepo/e2e-commons' );
		await expect( complete( 'test', '' ) ).resolves.toEqual(
			expect.arrayContaining( [ 'js', 'php', 'typecheck' ] )
		);
		await expect( complete( 'generate', '' ) ).resolves.toContain( 'js-package' );
	} );
} );
