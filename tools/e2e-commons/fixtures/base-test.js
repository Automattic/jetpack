/**
 * External dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { allure } from 'allure-playwright';
/**
 * Internal dependencies
 */
import { execWpCommand } from '../helpers/utils-helper.js';

test.beforeEach( async () => {
	await execWpCommand( 'transient delete wpcom_request_counter' );
} );

test.afterEach( async () => {
	const wpcomRequestCount = await execWpCommand( 'transient get wpcom_request_counter' );
	allure.addParameter( 'Requests to WPCOM API', parseInt( wpcomRequestCount ) || 0 );
} );

export { test, expect };
