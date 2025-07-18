/**
 * Internal dependencies
 */
import { authenticateUser, authenticateWordPressComUser } from '../helpers/login-utils.ts';
import { getDotComCredentials, getSiteCredentials } from '../helpers/utils-helper';
import { test as setup } from './base-test';

setup( 'authenticate users', async ( { request } ) => {
	await setup.step( 'authenticate local user', async () => {
		await authenticateUser( request, getSiteCredentials() );
	} );

	await setup.step( 'authenticate wordpress.com user', async () => {
		await authenticateWordPressComUser( request, getDotComCredentials() );
	} );
} );
