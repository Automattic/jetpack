import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { connect } from '../flows/index.js';
import { JetpackSocialPage } from '../pages/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withActivePlugins( [ 'social' ] )
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.build();
} );

test( 'Jetpack Social connection', async ( { page } ) => {
	const errorLogs = [];
	page.on( 'console', message => {
		if ( message.type() === 'error' ) {
			errorLogs.push( message.text() );
		}
	} );

	page.on( 'pageerror', err => {
		console.log( 'PAGE ERROR', err );
	} );

	await test.step( 'Can connect wordpress.com account to Jetpack Social', async () => {
		await connect( page );

		await page.evaluate( () => {
			console.error( 'hello from the browser' );
		} );

		const socialPage = await JetpackSocialPage.init( page );

		console.log( 'CONSOLE ERRORS', errorLogs );
		expect( await socialPage.isConnected(), 'Jetpack Social should be connected' ).toBeTruthy();
	} );
} );
