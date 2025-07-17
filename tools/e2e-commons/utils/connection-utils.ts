import fs from 'fs';
import { provisionJetpackStartConnection } from '../helpers/partner-provisioning';
import { execWpCommand, getDotComCredentials, getSiteCredentials } from '../helpers/utils-helper';

/**
 * Connect Jetpack.
 */
export async function connect() {
	const creds = getDotComCredentials();
	const siteCreds = getSiteCredentials();
	await execWpCommand( `user update ${ siteCreds.username } --user_email=${ creds.email }` );

	await provisionJetpackStartConnection( creds.userId, 'free', siteCreds.username );
}

/**
 * Save Jetpack private options to storage state.
 */
export async function saveJetpackPrivateOptionsToStorageState() {
	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'option get jetpack_private_options --format=json' );
	fs.writeFileSync(
		`${ process.env.STORAGE_STATE_DIR_PATH }/jetpack_private_options.json`,
		result.trim()
	);
}
