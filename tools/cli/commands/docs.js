import child_process from 'child_process';
import path from 'path';

/**
 * Command definition for the docs subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the docs commands defined.
 */
export function docsDefine( yargs ) {
	yargs.command(
		'docs [project]',
		'Parses documentation from a project and outputs them into a JSON file.',
		yarg => {
			yarg.positional( 'project', {
				describe:
					'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins, or "all"',
				type: 'string',
			} );
		},
		async argv => {
			await docsCli( argv );
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
 * @param {argv}  argv - the arguments passed.
 */
export async function docsCli( argv ) {
	const parser_options = [
		path.resolve( './projects/packages/doc-parser/runner.php' ),
		path.resolve( `./projects/plugins/${ argv.$0 }` ),
	];

	let data = child_process.spawnSync( 'php', parser_options, {
		cwd: path.resolve( './' ),
		stdio: [ 'inherit', 'inherit', 'ignore' ],
	} );

	if ( data.status !== 0 ) {
		// Something is wrong, let's try to run composer update.
		console.debug( 'Preparing doc-parser package...' );
		child_process.spawnSync( 'composer', [ 'update' ], {
			cwd: path.resolve( './projects/packages/doc-parser' ),
			stdio: 'ignore',
		} );
		data = child_process.spawnSync( 'php', parser_options, {
			cwd: path.resolve( './' ),
			stdio: 'ignore',
		} );
		if ( data.status !== 0 ) {
			console.error(
				"Failed to prepare the doc-parser package. Try running 'jetpack install -v packages/doc-parser'."
			);
		}
	}
}
