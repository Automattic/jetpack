import { Admin, test as baseTest, expect } from '@wordpress/e2e-test-utils-playwright';
import { allure } from 'allure-playwright';
import logger from '../logger';
import { EditorPage, Sidebar } from '../pages';
import { TestUtils } from '../utils/index';

const test = baseTest.extend<
	{ admin: Admin; editor: EditorPage; sidebar: Sidebar },
	{ testUtils: TestUtils }
>( {
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

	sidebar: async ( { page }, use ) => {
		await use( new Sidebar( page ) );
	},
} );

test.beforeEach( async ( { testUtils } ) => {
	await testUtils.executeWpCommand( 'transient delete wpcom_request_counter' );

	// This helps with reporting the global projects tests as separate tests in Allure.
	// The global projects tests run multiple times in a single run
	// and because all results are merged in a single Allure report these tests are reported as retries instead of separate runs.
	// Adding a parameter for the parent project makes Allure report them as separate tests.
	if ( process.env.PROJECT_NAME ) {
		allure.addParameter( 'Parent project', process.env.PROJECT_NAME );
	}
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
