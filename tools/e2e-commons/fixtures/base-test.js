import { allure } from 'allure-playwright';
import { test as baseTest } from '@playwright/test';
import config from 'config';
import logger from '../logger.js';
import { execWpCommand } from '../helpers/utils-helper.js';
export { expect } from '@playwright/test';

const test = baseTest.extend( {
	page: async ( { page }, use ) => {
		// Observe console logging
		page.on( 'console', message => {
			const type = message.type();

			// Ignore debug messages
			if ( ! [ 'warning', 'error' ].includes( type ) ) {
				return;
			}

			const text = message.text();

			// Ignore messages
			for ( const subString of config.consoleIgnore ) {
				if ( text.includes( subString ) ) {
					return;
				}
			}

			logger.debug( `CONSOLE: ${ type.toUpperCase() }: ${ text }` );
		} );

		page.on( 'pageerror', exception => {
			logger.debug( `Page error: "${ exception }"` );
		} );

		page.on( 'requestfailed', request => {
			logger.debug( `Request failed: ${ request.url() }  ${ request.failure().errorText }` );
		} );
		await use( page );
	},
} );

test.beforeEach( async () => {
	await execWpCommand( 'transient delete wpcom_request_counter' );
} );

test.afterEach( async () => {
	const wpcomRequestCount = await execWpCommand( 'transient get wpcom_request_counter' );
	allure.addParameter( 'Requests to WPCOM API', parseInt( wpcomRequestCount ) || 0 );
} );

export { test };
