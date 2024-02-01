import config from 'config';
import path from 'path';
import shellescape from 'shell-escape';
import logger from '../logger.js';
import { execSyncShellCommand, execWpCommand, resolveSiteUrl } from './utils-helper.js';
import * as url from 'url';

/**
 * Provisions Jetpack plan and connects the site through Jetpack Start flow
 *
 * @param {number} userId WPCOM user ID
 * @param {string} plan   One of free, personal, premium, or professional.
 * @param {string} user   Local user name, id, or e-mail
 * @return {string} authentication URL
 */
export async function provisionJetpackStartConnection( userId, plan = 'free', user = 'wordpress' ) {
	logger.info( `Provisioning Jetpack start connection [userId: ${ userId }, plan: ${ plan }]` );
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );
	const __dirname = url.fileURLToPath( new URL( '.', import.meta.url ) );
	const cmd = `sh ${ path.resolve(
		__dirname,
		'../../partner-provision.sh'
	) } --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ resolveSiteUrl() } --wpcom_user_id=${ userId }`;

	let response;
	// catch a command failed error so that secrets are not logged
	try {
		response = execSyncShellCommand( cmd );
	} catch ( error ) {
		throw new Error( `Jetpack Start provisioning command failed.` );
	}

	const json = JSON.parse( response );

	if ( json.success ) {
		logger.cli( 'Successful provisioning' );
	} else {
		throw new Error( `'Jetpack Start provisioning failed: ${ json.error }` );
	}

	await execWpCommand(
		`jetpack authorize_user --user=${ user } ` + shellescape( [ `--token=${ json.access_token }` ] )
	);

	await execWpCommand( 'jetpack status' );

	return true;
}
