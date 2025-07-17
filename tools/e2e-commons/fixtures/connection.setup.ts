/**
 * Internal dependencies
 */
import { ensureConnectedState } from '../env/prerequisites.js';
import { test as setup } from './base-test.ts';

setup( 'connect site', async () => {
	await ensureConnectedState( true );
} );
