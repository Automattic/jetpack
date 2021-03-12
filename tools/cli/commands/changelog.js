/**
 * External dependencies
 */
const cp = require('child_process');

/**
 * Command definition for the changelog subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the generate commands defined.
 */
export function changelogDefine(yargs) {
	yargs.command(
		'changelog [project]',
		'Creates a new changelog file for project',
		yarg => {
			yarg
				.positional('type', {
					describe: 'Type of project being worked on, e.g. package, plugin, etc',
					type: 'string',
				})
				.options('name', {
					alias: 'n',
					describe: 'Name of the project',
					type: 'string',
				});
		},
		async argv => {
			await changeloggerCli(argv);
		}
	);

	return yargs;
}

/**
 * Runs changelogger script for project specified.
 *
 * @param {object} argv - arguments passed as cli.
 */
export async function changeloggerCli(argv) {
	const projDir = './projects/' + argv.project + '/' + argv.name;
	cp.spawn('vendor/bin/changelogger add', [''], { cwd: projDir, stdio: 'inherit', shell: true });
}
