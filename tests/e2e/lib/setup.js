/**
 * External dependencies
 */
import config from 'config';
/**
 * Internal dependencies
 */
import { getNgrokSiteUrl } from './utils-helper';

const WP_ADMIN_USER = config.get( 'WP_ADMIN_USER' );

const ngrokURL = getNgrokSiteUrl();

const {
	WP_USERNAME = WP_ADMIN_USER.username,
	WP_PASSWORD = WP_ADMIN_USER.password,
	WP_BASE_URL = ngrokURL || config.get( 'WP_BASE_URL' ),
} = process.env;

process.env = Object.assign( process.env, {
	WP_PASSWORD,
	WP_ADMIN_USER,
	WP_USERNAME,
	WP_BASE_URL,
} );

console.log( 'Running tests against ' + WP_BASE_URL );

export { WP_PASSWORD, WP_ADMIN_USER, WP_USERNAME, WP_BASE_URL };
