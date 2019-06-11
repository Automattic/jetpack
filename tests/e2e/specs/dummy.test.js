/**
 * Internal dependencies
 */
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';

describe( 'First test', () => {
	it( 'Can go through the whole Jetpack connect process', async () => {
		await connectThroughWPAdminIfNeeded();
	} );
} );
