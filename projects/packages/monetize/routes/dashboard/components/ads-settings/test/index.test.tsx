import { render, screen } from '@testing-library/react';
import { getAdsSettingsData } from '../../../data/ads-settings-data';
import { useAdsSettings } from '../../../data/use-ads-settings';
import { AdsSettings } from '../index';
import type { AdsSettingsData } from '../../../data/ads-settings-data';
import type { AdsValues } from '../../../data/use-ads-settings';

jest.mock( '../../../data/ads-settings-data' );
jest.mock( '../../../data/tracking' );
jest.mock( '../../../data/use-ads-settings', () => ( {
	...jest.requireActual( '../../../data/use-ads-settings' ),
	useAdsSettings: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-connection/get-user-connection-url', () => ( {
	getUserConnectionUrl: () => '#connect',
} ) );

const DATA: AdsSettingsData = {
	hasWordAds: true,
	hasConnectedOwner: true,
	upgradeUrl: 'https://jetpack.com/redirect/?source=jetpack-creator-cta&site=1',
	earningsUrl: 'https://jetpack.com/redirect/?source=calypso-stats-ads-day&site=1',
	isSubdirectorySite: false,
};

const VALUES = {
	wordads: true,
	enable_header_ad: false,
	wordads_second_belowpost: false,
	wordads_inline_enabled: false,
	wordads_display_front_page: true,
	wordads_display_post: true,
	wordads_display_page: false,
	wordads_display_archive: false,
	wordads_ccpa_enabled: false,
	wordads_ccpa_privacy_policy_url: '',
	wordads_cmp_enabled: false,
	wordads_custom_adstxt_enabled: false,
	wordads_custom_adstxt: '',
} as AdsValues;

/**
 * Render the tab with the given server data and stored values.
 *
 * @param data   - Overrides for the server data.
 * @param values - Overrides for the stored values.
 */
function renderTab( data: Partial< AdsSettingsData > = {}, values: Partial< AdsValues > = {} ) {
	( getAdsSettingsData as jest.Mock ).mockReturnValue( { ...DATA, ...data } );
	( useAdsSettings as jest.Mock ).mockReturnValue( {
		values: { ...VALUES, ...values },
		loadError: false,
		saveError: false,
		saving: new Set(),
		setOption: jest.fn(),
		setModuleActive: jest.fn(),
	} );
	render( <AdsSettings /> );
}

describe( 'AdsSettings', () => {
	it.each( [
		[ 'the upgrade prompt without a plan', { hasWordAds: false }, 'link', 'Upgrade' ],
		[
			'the connect prompt without a plan or owner',
			{ hasWordAds: false, hasConnectedOwner: false },
			'link',
			'Connect',
		],
		[ 'the Ads switch with a plan', {}, 'switch', 'Enable ads and display an ad below each post' ],
	] )( 'shows %s', ( _label, data, role, name ) => {
		renderTab( data );

		expect( screen.getByRole( role, { name } ) ).toBeInTheDocument();
		expect( screen.queryAllByRole( 'switch' ).length > 0 ).toBe( role === 'switch' );
	} );

	it( 'links the upgrade prompt to the upgrade URL', () => {
		renderTab( { hasWordAds: false } );

		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			DATA.upgradeUrl
		);
	} );

	it( 'disables the placements while ads are off', () => {
		renderTab( {}, { wordads: false } );

		expect( screen.getByRole( 'switch', { name: 'Pages' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'hides ads.txt on a subdirectory site', () => {
		renderTab( { isSubdirectorySite: true } );

		expect(
			screen.queryByRole( 'switch', { name: 'Customize your ads.txt file' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'switch', { name: 'Enable GDPR Consent Banner' } )
		).toBeInTheDocument();
	} );
} );
