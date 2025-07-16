/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
/**
 * Internal dependencies
 */
import { authenticateUser } from '../helpers/login-utils.ts';
import { getSiteCredentials } from '../helpers/utils-helper';
import { test as setup } from './base-test';

const { STORAGE_STATE_PATH } = process.env;

setup.beforeAll( 'clear existing state', async () => {
	if ( STORAGE_STATE_PATH ) {
		const storageDir = path.dirname( STORAGE_STATE_PATH );

		if ( storageDir ) {
			console.log( `Clearing existing storage state at ${ storageDir }` );
			fs.rmSync( storageDir, { recursive: true } );

			// Recreate the parent directory after clearing
			console.log( `Recreating storage state directory at ${ storageDir }` );
			fs.mkdirSync( storageDir, { recursive: true } );
		}
	}
} );

setup( 'authenticate user', async ( { request } ) => {
	await authenticateUser( request, getSiteCredentials() );
} );
