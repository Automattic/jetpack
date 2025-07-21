/**
 * External dependencies
 */
import { test as baseTest, expect } from '@wordpress/e2e-test-utils-playwright';
import { allure } from 'allure-playwright';
/**
 * Internal dependencies
 */
import { execWpCommand } from '../helpers/utils-helper.js';
import logger from '../logger.js';

const test = baseTest.extend( {
	page: async ( { page }, use ) => {
		page.on( 'pageerror', exception => {
			logger.debug( `Page error: "${ exception }"` );
		} );
		await use( page );
	},
} );

test.beforeEach( async () => {
	await execWpCommand( 'transient delete wpcom_request_counter' );
} );

test.afterEach( async () => {
	const wpcomRequestCount = await execWpCommand( 'transient get wpcom_request_counter' );
	allure.description(
		`'Requests to WPCOM API: ${ String( parseInt( wpcomRequestCount ) || 0 ) }'`
	);
} );

export { test, expect };
