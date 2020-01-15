/**
 * External dependencies
 */
import config from 'config';
/**
 * Internal dependencies
 */
import { getNgrokSiteUrl } from './utils-helper';

const ngrokURL = getNgrokSiteUrl();

process.env.WP_BASE_URL = ngrokURL || config.get( 'WP_BASE_URL' );
