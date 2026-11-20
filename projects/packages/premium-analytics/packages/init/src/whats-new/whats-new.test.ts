/**
 * External dependencies
 */
import { mountWhatsNew } from '@automattic/jetpack-announcements';
/**
 * Internal dependencies
 */
import { showWhatsNew } from './whats-new';

jest.mock( '@automattic/jetpack-announcements', () => ( {
	mountWhatsNew: jest.fn(),
} ) );

const setScriptData = ( premiumAnalytics: Record< string, unknown > ): void => {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: premiumAnalytics },
	} );
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

describe( 'showWhatsNew', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
		jest.mocked( mountWhatsNew ).mockClear();
	} );

	it.each< [ string, boolean, number ] >( [
		[ 'mounts while the flag is on', true, 1 ],
		[ 'mounts nothing while the flag is off', false, 0 ],
	] )( '%s', async ( _case, enabled, mounts ) => {
		setScriptData( { whats_new_enabled: enabled } );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( mounts );
	} );

	// Jest fails a test that leaves a rejection unhandled.
	it( 'stays quiet when the surface fails to mount', async () => {
		jest.mocked( mountWhatsNew ).mockImplementationOnce( () => {
			throw new Error( 'mount failed' );
		} );
		setScriptData( { whats_new_enabled: true } );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );
} );
