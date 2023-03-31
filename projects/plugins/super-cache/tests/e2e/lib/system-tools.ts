import childProcess from 'node:child_process';
import util from 'util';
import shellEscape from 'shell-escape';

const execPromise = util.promisify( childProcess.exec );

/**
 * Execute a command in the local shell. Returns its stdout.
 *
 * @param {...string} command - Command to run. Each string will be escaped.
 * @return {string} stdout contents.
 */
export function exec( ...command: string[] ) {
	return execPromise( shellEscape( command ) );
}
