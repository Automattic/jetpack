/**
 * External dependencies
 */
import { Admin, test as baseTest, expect } from '@wordpress/e2e-test-utils-playwright';
import { allure } from 'allure-playwright';
/**
 * Internal dependencies
 */
import logger from '../logger.ts';
import EditorPage from '../pages/editor-page.ts';
import { TestUtils } from '../utils/index.js';

const test = baseTest.extend< { admin: Admin; editor: EditorPage }, { testUtils: TestUtils } >( {
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

	testUtils: [
		async ( { requestUtils }, use ) => {
			await use( new TestUtils( requestUtils ) );
		},
		{ scope: 'worker' },
	],

	editor: async ( { page }, use ) => {
		await use( new EditorPage( { page } ) );
	},
} );

test.beforeEach( async ( { testUtils } ) => {
	await testUtils.executeWpCommand( 'transient delete wpcom_request_counter' );
} );

test.afterEach( async ( { testUtils } ) => {
	const wpcomRequestCount = await testUtils.executeWpCommand(
		'transient get wpcom_request_counter'
	);
	allure.description(
		`'Requests to WPCOM API: ${ String( parseInt( wpcomRequestCount ) || 0 ) }'`
	);
} );

export { test, expect, Admin };
