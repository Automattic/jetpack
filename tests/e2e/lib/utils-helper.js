/**
 * External dependencies
 */
import { execSync, exec } from 'child_process';
import config from 'config';
import logger from './logger';

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
export async function execShellCommand( cmd ) {
	return new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout ) => {
			if ( error ) {
				logger.warn( error.toString() );
				return resolve( error );
			}
			return resolve( stdout );
		} );
		cmdExec.stdout.on( 'data', data => logger.info( data ) );
	} );
}

export function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

export function getNgrokSiteUrl() {
	return global.tunnelUrl.replace( 'http:', 'https:' );
}

export async function resetWordpressInstall() {
	const cmd = './tests/e2e/bin/env.sh reset';
	await execShellCommand( cmd );
}

export async function prepareUpdaterTest() {
	const cmd =
		'yarn wp-env run tests-wordpress wp-content/plugins/jetpack-dev/tests/e2e/bin/prep.sh';

	await execShellCommand( cmd );
}

/**
 * Provisions Jetpack plan through Jetpack Start flow
 *
 * @param {string} plan One of free, personal, premium, or professional.
 * @param {string} user Local user name, id, or e-mail
 * @return {string} authentication URL
 */
export function provisionJetpackStartConnection( plan = 'professional', user = 'wordpress' ) {
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );
	const url = getNgrokSiteUrl();

	const cmd = `sh ./bin/partner-provision.sh --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ url }`;

	const response = execSyncShellCommand( cmd );
	logger.info( response );

	const json = JSON.parse( response );
	if ( json.success !== true ) {
		throw new Error( 'Jetpack Start provision is failed. Response: ' + response );
	}

	return json.next_url;
}

/**
 * Runs wp cli command to activate jetpack module, also checks if the module is available in the list of active modules.
 *
 * @param {page} page Puppeteer page object
 * @param {string} module Jetpack module name
 */
export async function activateModule( page, module ) {
	const cliCmd = `wp jetpack module activate ${ module }`;
	const activeModulesCmd = 'wp option get jetpack_active_modules --format=json';
	await execWpCommand( cliCmd );

	const modulesList = JSON.parse( await execWpCommand( activeModulesCmd ) );

	if ( ! modulesList.includes( module ) ) {
		throw new Error( `${ module } is failed to activate` );
	}

	await page.waitForTimeout( 1000 );
	await page.reload( { waitFor: 'networkidle0' } );

	return true;
}

export async function execWpCommand( wpCmd ) {
	const cmd = `yarn wp-env run tests-cli "${ wpCmd }"`;

	logger.info( cmd );
	const result = await execShellCommand( cmd );

	// By default, `wp-env run` outputs the actual command beeing run, and also adds newline to the end of the output.
	// Here we cleaning this up.
	if ( typeof result !== 'object' && result.length > 0 ) {
		return result.trim().split( '\n' ).slice( 1 ).join( '\n' );
	}

	return result;
}

/**
 * Runs multiple wp commands in a single call
 *
 * @param  {...string} commands Array of wp commands to run together
 */
export async function execMultipleWpCommands( ...commands ) {
	return await execWpCommand( `bash -c '${ commands.join( ' && ' ) }'` );
}
