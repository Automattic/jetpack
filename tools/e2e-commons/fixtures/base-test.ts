/**
 * External dependencies
 */
import { test as baseTest, expect, RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { allure } from 'allure-playwright';
/**
 * Internal dependencies
 */
import { execWpCommand, getSiteCredentials } from '../helpers/utils-helper.js';
import logger from '../logger.js';

const test = baseTest.extend( {
	page: async ( { page }, use ) => {
		page.on( 'pageerror', exception => {
			logger.error( `Page error: "${ exception }"` );
		} );

		await page.context().addCookies( [
			{
				name: 'sensitive_pixel_options',
				value: '{"ok":true,"buckets":{"essential":true,"analytics":false,"advertising":false}}',
				domain: 'wordpress.com',
				path: '/',
			},
		] );

		await use( page );
	},

	requestUtils: async ( {}, use ) => {
		const creds = getSiteCredentials();
		const requestUtils = await RequestUtils.setup( {
			user: {
				username: creds.username,
				password: creds.password,
			},
		} );
		await use( requestUtils );
	},
} );

test.beforeEach( async () => {
	await execWpCommand( 'transient delete wpcom_request_counter' );
} );

test.afterEach( async () => {
	const wpcomRequestCount = await execWpCommand( 'transient get wpcom_request_counter' );
	allure.addParameter( 'Requests to WPCOM API', String( parseInt( wpcomRequestCount ) || 0 ) );
} );

export { test, expect };
