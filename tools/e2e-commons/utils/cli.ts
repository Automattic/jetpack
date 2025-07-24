import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../logger.js';

const execAsync = promisify( exec );

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd - shell command
 * @return {Promise<string>} output
 */
export async function executeCommand( cmd ) {
	logger.debug( `Executing command: ${ cmd }` );
	try {
		const { stdout, stderr } = await execAsync( cmd );
		const output = stdout + stderr;
		logger.debug( `Command output: ${ output.replace( /\n$/, '' ) }` );
		return output;
	} catch ( error ) {
		logger.warn( `Command error: ${ error.toString() }` );
		return error;
	}
}

/**
 * Executes a shell command within the Docker container.
 *
 * @param {string} cmd - shell command to run in container
 * @return {Promise<string>} output
 */
export async function executeContainerCommand( cmd ) {
	return executeCommand( `pnpm jetpack docker --type e2e --name t1 ${ cmd }` );
}

/**
 * Executes a WordPress CLI command.
 *
 * @param {string}  command     - WordPress CLI command (without 'wp' prefix)
 * @param {boolean} inContainer - Whether to run command in Docker container (default: true)
 * @return {Promise<string>} Command output
 */
export async function executeWpCommand( command, inContainer = true ) {
	return inContainer
		? await executeContainerCommand( `wp -- ${ command }` )
		: await executeCommand( `wp ${ command }` );
}

/**
 * Executes a Jetpack CLI command.
 *
 * @param {string}  command     - Jetpack CLI command (without 'jetpack' prefix)
 * @param {boolean} inContainer - Whether to run command in Docker container (default: true)
 * @return {Promise<string>} Command output
 */
export async function executeJetpackCommand( command, inContainer = true ) {
	return await executeWpCommand( `jetpack ${ command }`, inContainer );
}
