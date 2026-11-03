import fs from 'fs/promises';
import os from 'os';
import path from 'path';
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
	test.each( [
		[ '/bin/zsh', /^#compdef jetpack\n/ ],
		[ '/bin/bash', /\ncomplete -o bashdefault -o default -F _jetpack_yargs_completions jetpack\n/ ],
	] )( 'prints the script for the shell in $SHELL (%s)', async ( shell, expected ) => {
		const { stdout } = await execa( bin, [ 'completion' ], {
			encoding: 'utf8',
			env: { SHELL: shell },
		} );
		expect( stdout ).toMatch( expected );
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
	test.each( [ 'composer', 'pnpm' ] )(
		'never runs %s for the half-typed command',
		async command => {
			const dir = await fs.mkdtemp( path.join( os.tmpdir(), 'jetpack-completion-' ) );
			await fs.writeFile( path.join( dir, command ), '#!/bin/sh\necho ran\n', { mode: 0o755 } );
			try {
				const { stdout } = await execa(
					bin,
					[ '--get-yargs-completions', 'jetpack', command, 'up' ],
					{
						encoding: 'utf8',
						env: { SHELL: '/bin/bash', PATH: `${ dir }:${ process.env.PATH }` },
					}
				);
				expect( stdout ).not.toContain( 'ran' );
			} finally {
				await fs.rm( dir, { recursive: true, force: true } );
			}
		}
	);
} );
