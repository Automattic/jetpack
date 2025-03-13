import child_process from 'child_process';
import path from 'path';

/**
 * Command definition for the MCP subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the docs commands defined.
 */
export function mcpDefine( yargs ) {
	yargs.command(
		'mcp [server]',
		'Runs a specified MCP server for AI.',
		yarg => {
			yarg
				.positional( 'server', {
					describe: 'MCP server name, like mcp-server-monorepo',
					type: 'string',
					default: '.',
				} )
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} );
		},
		async argv => {
			await mcpCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handle args for docs command.
 *
 * @param {argv} argv - the arguments passed.
 */
export async function mcpCli( argv ) {
	const server_package_path = path.resolve( './projects/js-packages/' + argv.server );

	child_process.execFileSync( 'node', [ '--import=tsx', 'src/index.ts', argv.project ], {
		cwd: server_package_path,
		stdio: [ process.stdin, process.stdout, process.stderr ],
		env: {
			NODE_PATH: process.env.NODE_PATH + ':' + server_package_path + '/node_modules',
		},
	} );
}
