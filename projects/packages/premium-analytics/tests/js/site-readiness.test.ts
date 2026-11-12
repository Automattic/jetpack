/**
 * Internal dependencies
 */
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
	isVideoPressAvailable,
} from '../../routes/site-readiness';

/**
 * Set Jetpack script data for route readiness tests.
 *
 * @param data - Script data to expose on the window.
 */
function setScriptData( data: Record< string, unknown > ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: data,
	} );
}

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'Premium Analytics site readiness', () => {
	it( 'treats WordPress.com Simple sites as connected and synced', () => {
		setScriptData( {
			site: { host: 'wpcom' },
		} );

		expect( isPremiumAnalyticsSiteConnected() ).toBe( true );
		expect( isPremiumAnalyticsInitialSyncFinished() ).toBe( true );
	} );

	it( 'uses Jetpack connection and sync state for non-Simple sites', () => {
		setScriptData( {
			site: { host: 'unknown' },
			connection: {
				connectionStatus: {
					isRegistered: true,
				},
			},
			premium_analytics: {
				initial_full_sync_finished: 123,
			},
		} );

		expect( isPremiumAnalyticsSiteConnected() ).toBe( true );
		expect( isPremiumAnalyticsInitialSyncFinished() ).toBe( true );
	} );

	it( 'does not mark unsynced non-Simple sites as ready', () => {
		setScriptData( {
			site: { host: 'unknown' },
			connection: {
				connectionStatus: {
					isRegistered: true,
				},
			},
		} );

		expect( isPremiumAnalyticsSiteConnected() ).toBe( true );
		expect( isPremiumAnalyticsInitialSyncFinished() ).toBe( false );
	} );

	it( 'reads VideoPress availability from the server flag', () => {
		setScriptData( { premium_analytics: { has_videopress: true } } );

		expect( isVideoPressAvailable() ).toBe( true );
	} );

	it.each( [
		[ 'the flag is false', { premium_analytics: { has_videopress: false } } ],
		[ 'the flag is absent', { premium_analytics: { initial_full_sync_finished: 123 } } ],
		[ 'no script data was published', {} ],
	] )( 'treats VideoPress as unavailable when %s', ( _case, data ) => {
		setScriptData( data );

		expect( isVideoPressAvailable() ).toBe( false );
	} );
} );
