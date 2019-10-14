/**
 * External dependencies
 */
import { execSync, exec } from 'child_process';
import config from 'config';

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
export async function execShellCommand( cmd ) {
	return new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout ) => {
			if ( error ) {
				console.warn( error );
			}
			return resolve( stdout ? stdout : error );
		} );
		cmdExec.stdout.on( 'data', data => console.log( data ) );
	} );
}

export function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

export function getNgrokSiteUrl() {
	const cmd =
		'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)';
	return execSyncShellCommand( cmd );
}

export async function resetWordpressInstall() {
	let cmd = './tests/e2e/docker/setup-travis-e2e-tests.sh reset';
	if ( process.env.CI ) {
		cmd = './tests/e2e/bin/setup-e2e-travis.sh reset_wp';
	}
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
	console.log( response );

	const json = JSON.parse( response );
	if ( json.success !== true ) {
		throw new Error( 'Jetpack Start provision is failed. Response: ' + response );
	}

	return json.next_url;
}

/**
 * Runs wp cli command to activate jetpack module
 * @param {string} module Jetpack module name
 */
export async function activateModule( module ) {
	const cliCmd = `wp jetpack module activate ${ module }`;
	let cmd = `./tests/e2e/docker/whatever.sh cli "${ cliCmd }"`;
	if ( process.env.CI ) {
		cmd = `${ cliCmd } --path="/home/travis/wordpress"`;
	}

	await execShellCommand( cmd );
}
