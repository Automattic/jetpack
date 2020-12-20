import child_process from 'child_process';
import chalk from 'chalk';
import { chalkJetpackGreen } from './helpers/styling';
// eslint-disable-next-line no-console
const log = console.log;

/**
 * @param options
 */
export async function builder( options ) {
	options = {
		...options,
		targetDirectory: options.targetDirectory || process.cwd(),
	};

	switch ( options.project ) {
		case 'plugins/jetpack':
			log(
				chalkJetpackGreen(
					'Hell yeah! It is time to build Jetpack!\n' +
						'Go ahead and sit back. Relax. This will take a few minutes.'
				)
			);
			child_process.spawnSync( 'yarn', [ 'build-jetpack' ], {
				shell: true,
				stdio: 'inherit',
			} );
			break;
		default:
			log( chalk.yellow( 'This project does not have a build step defined.' ) );
	}

	return true;
}
