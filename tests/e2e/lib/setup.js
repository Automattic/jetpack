/**
 * External dependencies
 */
import config from 'config';
import { execSync } from 'child_process';

const WP_ADMIN_USER = config.get( 'WP_ADMIN_USER' );

const {
	WP_USERNAME = WP_ADMIN_USER.username,
	WP_PASSWORD = WP_ADMIN_USER.password,
	WP_BASE_URL = config.get( 'WP_BASE_URL' ),
} = process.env;

process.env = Object.assign( process.env, {
	WP_PASSWORD,
	WP_ADMIN_USER,
	WP_USERNAME,
	WP_BASE_URL,
} );

console.log( 'Running tests against ' + WP_BASE_URL );
const out = execSync(
	'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)'
);
console.log( 'Ngrok execSync: ' + out.toString() );

export { WP_PASSWORD, WP_ADMIN_USER, WP_USERNAME, WP_BASE_URL };
