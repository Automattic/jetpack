import { execFile } from 'child_process';
import { promisify } from 'util';
import logger from '../logger.js';

const execFileAsync = promisify( execFile );

// Security: Allowed commands to prevent command injection
const ALLOWED_COMMANDS = new Set( [ 'wp', 'pnpm', 'sh' ] );

/**
 * Masks sensitive information in command strings and output
 * @param {string} text - Text to mask secrets in
 * @return {string} Text with secrets masked
 */
function maskSecrets( text: string ): string {
	if ( process.env.SHOW_SECRETS ) {
		return text;
	}

	const secretPatterns = [
		/(Authorization:\s*Bearer\s+)([^\s'"]+)/gi,
		/(Authorization:\s*Token\s+)([^\s'"]+)/gi,
		/((?:-{0,2}|"?)[\w]*secret(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
		/((?:-{0,2}|"?)[\w]*key(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
		/((?:-{0,2}|"?)[\w]*token(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
		/((?:-{0,2}|"?)[\w]*pass(?:word)?(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
		/((?:-{0,2}|"?)auth(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
		/((?:-{0,2}|"?)bearer(?:"?\s*:\s*"?|[=:\s]+))([^\s'",}]+)/gi,
	];

	let maskedText = text;

	secretPatterns.forEach( pattern => {
		maskedText = maskedText.replace( pattern, ( _, prefix, secret ) => {
			// Remove quotes if present
			const cleanSecret = secret.replace( /^['"]|['"]$/g, '' );

			if ( cleanSecret.length <= 4 ) {
				return `${ prefix }****`;
			}

			const firstTwo = cleanSecret.substring( 0, 2 );
			const lastTwo = cleanSecret.substring( cleanSecret.length - 2 );
			const masked = `${ firstTwo }***${ lastTwo }`;

			return `${ prefix }${ masked }`;
		} );
	} );

	return maskedText;
}

/**
 * Security: Validates that a command is in the allowed list
 * @param {string} command - Command to validate
 * @return {boolean} Whether command is allowed
 */
function validateCommand( command: string ): boolean {
	// Only allow alphanumeric, hyphens, underscores, and dots
	const commandRegex = /^[a-zA-Z0-9._-]+$/;
	return commandRegex.test( command ) && ALLOWED_COMMANDS.has( command );
}

/**
 * Parses command string into command and arguments safely
 * @param {string} cmdString - Command string to parse
 * @return {object} Object with command and args array
 */
function parseCommandString( cmdString: string ): { command: string; args: string[] } {
	const parts = cmdString.trim().split( /\s+/ );
	const command = parts[ 0 ];
	const args = parts.slice( 1 );

	if ( ! validateCommand( command ) ) {
		const error = `Command '${ command }' not allowed`;
		logger.error( error );
		throw new Error( error );
	}

	// execFile handles arrays safely without needing shell escaping
	return { command, args };
}

/**
 * Executes a shell command using execFile.
 *
 * @param {string} cmd - shell command string to execute
 * @return {Promise<string>} command output
 */
export async function executeCommand( cmd: string ): Promise< string > {
	logger.debug( `Executing command: ${ maskSecrets( cmd ) }` );

	const { command, args } = parseCommandString( cmd );

	try {
		const { stdout, stderr } = await execFileAsync( command, args );
		const output = stdout + stderr;
		logger.debug( `Command output: ${ maskSecrets( output.replace( /\n$/, '' ) ) }` );
		return output;
	} catch ( error ) {
		logger.warn( `Command error: ${ maskSecrets( error.toString() ) }` );
		throw error;
	}
}

/**
 * Executes a shell command within the Docker container.
 *
 * @param {string} cmd - shell command to run in container
 * @return {Promise<string>} command output
 */
export async function executeContainerCommand( cmd: string ): Promise< string > {
	return executeCommand( `pnpm jetpack docker --type e2e --name t1 ${ cmd }` );
}

/**
 * Executes a WordPress CLI command.
 *
 * @param {string}  command     - WordPress CLI command (without 'wp' prefix)
 * @param {boolean} inContainer - Whether to run command in Docker container (default: true)
 * @return {Promise<string>} Command output
 */
export async function executeWpCommand(
	command: string,
	inContainer: boolean = true
): Promise< string > {
	if ( inContainer ) {
		return executeContainerCommand( `wp -- ${ command }` );
	}
	return executeCommand( `wp ${ command }` );
}

/**
 * Executes a Jetpack CLI command.
 *
 * @param {string}  command     - Jetpack CLI command (without 'jetpack' prefix)
 * @param {boolean} inContainer - Whether to run command in Docker container (default: true)
 * @return {Promise<string>} Command output
 */
export async function executeJetpackCommand(
	command: string,
	inContainer = true
): Promise< string > {
	return await executeWpCommand( `jetpack ${ command }`, inContainer );
}

/**
 * Executes a Jetpack Boost CLI command.
 *
 * @param {string}  command     - Jetpack Boost CLI command (without 'jetpack-boost' prefix)
 * @param {boolean} inContainer - Whether to run command in Docker container (default: true)
 * @return {Promise<string>} Command output
 */
export async function executeJetpackBoostCommand(
	command: string,
	inContainer = true
): Promise< string > {
	return await executeWpCommand( `jetpack-boost ${ command }`, inContainer );
}
