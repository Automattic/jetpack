/**
 * External dependencies
 */
import { select, dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { siteSyncStore, SITE_SYNC_STORE } from './store';

jest.mock( '@automattic/jetpack-script-data' );

describe( 'siteSyncStore', () => {
	it( 'exposes a namespaced store id', () => {
		expect( SITE_SYNC_STORE ).toBe( 'jetpack-premium-analytics/site-sync' );
	} );

	describe( 'milestone state', () => {
		afterEach( () => {
			// Singleton store: reset between cases for isolation.
			dispatch( siteSyncStore ).setMilestone( 0 );
		} );

		it( 'setMilestone updates the milestone the selector returns', () => {
			dispatch( siteSyncStore ).setMilestone( 1_700_000_000 );
			expect( select( siteSyncStore ).getMilestone() ).toBe( 1_700_000_000 );
		} );

		it( 'isInitialSyncFinished is false at the 0 boundary', () => {
			dispatch( siteSyncStore ).setMilestone( 0 );
			expect( select( siteSyncStore ).isInitialSyncFinished() ).toBe( false );
		} );

		it( 'isInitialSyncFinished is true for any positive milestone', () => {
			dispatch( siteSyncStore ).setMilestone( 1 );
			expect( select( siteSyncStore ).isInitialSyncFinished() ).toBe( true );
		} );
	} );

	describe( 'script-data seed', () => {
		it( 'seeds the milestone from script-data at import time', async () => {
			await jest.isolateModulesAsync( async () => {
				const scriptData = await import( '@automattic/jetpack-script-data' );
				( scriptData.getScriptData as jest.Mock ).mockReturnValue( {
					premium_analytics: { initial_full_sync_finished: 1_700_000_000 },
				} );

				// Fresh @wordpress/data registry + fresh store registration so the
				// seed runs against the mocked script-data above.
				const data = await import( '@wordpress/data' );
				const { siteSyncStore: freshStore } = await import( './store' );

				expect( data.select( freshStore ).getMilestone() ).toBe( 1_700_000_000 );
			} );
		} );

		it( 'defaults the milestone to 0 when script-data has no finished timestamp', async () => {
			await jest.isolateModulesAsync( async () => {
				const scriptData = await import( '@automattic/jetpack-script-data' );
				( scriptData.getScriptData as jest.Mock ).mockReturnValue( {} );

				const data = await import( '@wordpress/data' );
				const { siteSyncStore: freshStore } = await import( './store' );

				expect( data.select( freshStore ).getMilestone() ).toBe( 0 );
			} );
		} );
	} );
} );
