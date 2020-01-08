/**
 * External dependencies
 */
const config = require( 'config' );
/**
 * Internal dependencies
 */
const { getNgrokSiteUrl } = require( './utils-helper' );

const ngrokURL = getNgrokSiteUrl();
console.log( 'out1:' + ngrokURL );

process.env.WP_BASE_URL = ngrokURL || config.get( 'WP_BASE_URL' );
