import { fileURLToPath } from 'url';
import { execa } from 'execa';

/**
 * Ask the CLI for completions the way the generated shell script does.
 *
 * @param {...string} words - The command line so far, the last word being the one completed.
 * @return {Promise<string[]>} Candidates.
 */
async function complete( ...words ) {
	const { stdout } = await execa(
		fileURLToPath( new URL( '../../../bin/jetpack.js', import.meta.url ) ),
		[ '--get-yargs-completions', 'jetpack', ...words ],
		{ encoding: 'utf8', env: { SHELL: '/bin/bash' } }
	);
	return stdout.split( '\n' );
}

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
