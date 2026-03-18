import path from 'path';
import * as url from 'url';
import config from 'config';
import logger from '../logger';
import pwConfig from '../playwright.config';
import { executeCommand, executeJetpackCommand } from './cli';

/**
 * Connect Jetpack.
 */
/**
 * Provisions Jetpack plan and connects the site through Jetpack Start flow
 *
 * @param {number} userId - WPCOM user ID
 * @param {string} plan   - One of free, personal, premium, or professional.
 * @param {string} user   - Local user name, id, or e-mail
 * @return {string} authentication URL
 */
export async function partnerProvisionConnection(
	userId: string,
	plan: string = 'free',
	user: string
): Promise< boolean > {
	logger.info( `Provisioning Jetpack start connection [userId: ${ userId }, plan: ${ plan }]` );
	const [ clientID, clientSecret ] = config.get< Array< string > >( 'jetpackStartSecrets' );
	const __dirname = url.fileURLToPath( new URL( '.', import.meta.url ) );

	const scriptPath = path.resolve( __dirname, '../../partner-provision.sh' );
	const cmd = `sh ${ scriptPath } --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ pwConfig.use?.baseURL } --wpcom_user_id=${ userId }`;

	let response: string;
	// catch a command failed error so that secrets are not logged
	try {
		response = await executeCommand( cmd );
	} catch {
		throw new Error( `Jetpack Start provisioning command failed.` );
	}

	const json = JSON.parse( response );

	if ( json.success ) {
		logger.debug( 'Successful provisioning' );
	} else {
		throw new Error( `Jetpack Start provisioning failed: ${ json.error }` );
	}

	await executeJetpackCommand( `authorize_user --user=${ user } --token=${ json.access_token }` );

	return true;
}

/**
 * Cancels partner plan
 */
export async function cancelPartnerPlan() {
	logger.info( `Cancelling partner plan` );
	const [ clientID, clientSecret ] = config.get< string[] >( 'jetpackStartSecrets' );
	const __dirname = url.fileURLToPath( new URL( '.', import.meta.url ) );
	const scriptPath = path.resolve( __dirname, '../../partner-cancel.sh' );
	const cmd = `sh ${ scriptPath } --partner_id=${ clientID } --partner_secret=${ clientSecret } --allow-root`;
	await executeCommand( cmd );
}
