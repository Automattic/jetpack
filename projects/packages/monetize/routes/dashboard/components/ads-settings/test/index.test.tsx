import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getAdsSettingsData } from '../../../data/ads-settings-data';
import { useAdsSettings } from '../../../data/use-ads-settings';
import { AdsSettings } from '../index';
import type { AdsSettingsData } from '../../../data/ads-settings-data';
import type { AdsValues } from '../../../data/use-ads-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/ads-settings-data' );
jest.mock( '../../../data/tracking' );
jest.mock( '../../../data/use-ads-settings', () => ( {
	...jest.requireActual( '../../../data/use-ads-settings' ),
	useAdsSettings: jest.fn(),
} ) );
jest.mock( '../../../data/use-wpcom-connection', () => ( {
	__esModule: true,
	default: () => ( { canUseWpcom: true } ),
} ) );
jest.mock( '../../../data/use-wpcom-ads-settings', () => ( { useWpcomAdsSync: () => jest.fn() } ) );
jest.mock( '../payout-card', () => ( { PayoutCard: () => null } ) );
jest.mock( '@automattic/jetpack-connection/get-user-connection-url', () => ( {
	getUserConnectionUrl: () => '#connect',
} ) );

const DATA: AdsSettingsData = {
	hasWordAds: true,
	hasConnectedOwner: true,
	upgradeUrl: 'https://jetpack.com/redirect/?source=jetpack-creator-cta&site=1',
	earningsUrl: 'https://jetpack.com/redirect/?source=calypso-stats-ads-day&site=1',
	isSubdirectorySite: false,
	moduleOverride: false,
	tracks: true,
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

const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Render the tab with the given server data, stored values, and the features WordPress.com reports now.
 *
 * @param data     - Overrides for the server data.
 * @param values   - Overrides for the stored values.
 * @param features - The active features, or the error the features request fails with.
 */
function renderTab(
	data: Partial< AdsSettingsData > = {},
	values: Partial< AdsValues > = {},
	features: string[] | Error = []
) {
	if ( features instanceof Error ) {
		mockedApiFetch.mockRejectedValue( features );
	} else {
		mockedApiFetch.mockResolvedValue( { data: JSON.stringify( { active: features } ) } );
	}
	( getAdsSettingsData as jest.Mock ).mockReturnValue( { ...DATA, ...data } );
	( useAdsSettings as jest.Mock ).mockReturnValue( {
		values: { ...VALUES, ...values },
		loadError: false,
		saveError: false,
		saving: new Set(),
		setOption: jest.fn(),
		setModuleActive: jest.fn(),
	} );
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<AdsSettings />
		</QueryClientProvider>
	);
}

const SWITCH = 'Enable ads and display an ad below each post';

describe( 'AdsSettings', () => {
	beforeEach( () => mockedApiFetch.mockReset() );

	it.each( [
		[ 'the upgrade prompt without a plan', { hasWordAds: false }, [], 'link', 'Upgrade' ],
		[
			'the connect prompt without a plan or owner',
			{ hasWordAds: false, hasConnectedOwner: false },
			[],
			'link',
			'Connect',
		],
		[ 'the Ads switch with a plan', {}, [], 'switch', SWITCH ],
		[
			'the Ads switch when the cached plan missed a purchase',
			{ hasWordAds: false },
			[ 'wordads' ],
			'switch',
			SWITCH,
		],
		[
			'the upgrade prompt when WordPress.com cannot say',
			{ hasWordAds: false },
			new Error(),
			'link',
			'Upgrade',
		],
	] )( 'shows %s', async ( _label, data, features, role, name ) => {
		renderTab( data, {}, features );

		await expect( screen.findByRole( role, { name } ) ).resolves.toBeInTheDocument();
		expect( screen.queryAllByRole( 'switch' ).length > 0 ).toBe( role === 'switch' );
	} );

	it( 'asks WordPress.com only when the cached plan lacks WordAds', async () => {
		renderTab();

		await expect( screen.findByRole( 'switch', { name: SWITCH } ) ).resolves.toBeInTheDocument();
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'links the upgrade prompt to the upgrade URL', async () => {
		renderTab( { hasWordAds: false } );

		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toHaveAttribute(
			'href',
			DATA.upgradeUrl
		);
	} );

	it( 'locks the Ads switch the host forces, and says why', () => {
		renderTab( { moduleOverride: 'active' } );

		expect( screen.getByRole( 'switch', { name: SWITCH } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByText( 'Enabled by your host or site administrator' ) ).toBeInTheDocument();
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
