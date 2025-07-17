/**
 * Internal dependencies
 */
import { authenticateUser } from '../helpers/login-utils.ts';
import { getSiteCredentials } from '../helpers/utils-helper';
import { test as setup } from './base-test';

setup( 'authenticate user', async ( { request } ) => {
	await authenticateUser( request, getSiteCredentials() );
} );
