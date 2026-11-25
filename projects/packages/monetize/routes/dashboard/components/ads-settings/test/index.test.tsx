import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { getAdsSettingsData } from '../../../data/ads-settings-data';
import { useAdsSettings } from '../../../data/use-ads-settings';
import { usePayout, useSavePayout } from '../../../data/use-wpcom-ads-settings';
import { useAdsAccount, useAdsEarnings } from '../../../data/wordads';
import { AdsSettings } from '../index';
import type { AdsSettingsData } from '../../../data/ads-settings-data';
import type { AdsValues } from '../../../data/use-ads-settings';

let mockSimple = false;
let mockCanJoin = true;
const mockJoin = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockSimple,
	isWpcomPlatformSite: () => mockSimple,
} ) );
jest.mock( '../../../data/wordads', () => ( {
	useAdsAccount: jest.fn(),
	useAdsEarnings: jest.fn(),
	useJoinWordAds: () => ( { mutate: mockJoin, isPending: false, isError: false } ),
} ) );
jest.mock( '../../../data/notices' );
jest.mock( '../../../data/ads-settings-data' );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: MOCK_UPGRADE_URL, tracks: true } ),
	getSectionState: () => ( { canJoinWordAds: mockCanJoin } ),
} ) );
jest.mock( '../../../data/tracking' );
jest.mock( '../../../data/use-ads-settings', () => ( {
	...jest.requireActual( '../../../data/use-ads-settings' ),
	useAdsSettings: jest.fn(),
} ) );
jest.mock( '../../../data/use-wpcom-connection', () => ( {
	__esModule: true,
	default: () => ( { canUseWpcom: true } ),
} ) );
jest.mock( '../../../data/use-wpcom-ads-settings', () => ( {
	useWpcomAdsSync: () => jest.fn(),
	usePayout: jest.fn(),
	useSavePayout: jest.fn(),
} ) );
jest.mock( '../payout-card', () => ( { PayoutCard: () => <p>Payout card</p> } ) );
jest.mock( '@automattic/jetpack-connection/get-user-connection-url', () => ( {
	getUserConnectionUrl: () => '#connect',
} ) );

const MOCK_UPGRADE_URL = 'https://jetpack.com/redirect/?source=jetpack-creator-cta&site=1';

const DATA: AdsSettingsData = {
	hasWordAds: true,
	hasConnectedOwner: true,
	isSubdirectorySite: false,
	moduleOverride: false,
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
			<AdsSettings openTab={ openTab } />
		</QueryClientProvider>
	);
}

const SWITCH = 'Enable ads and display an ad below each post';
const acceptTerms = jest.fn();
const openTab = jest.fn();

describe( 'AdsSettings', () => {
	beforeEach( () => {
		mockSimple = false;
		mockCanJoin = true;
		( useAdsAccount as jest.Mock ).mockReturnValue( {
			data: { approved: true },
			isPending: false,
		} );
		mockedApiFetch.mockReset();
		openTab.mockReset();
		acceptTerms.mockReset().mockResolvedValue( {} );
		( useAdsEarnings as jest.Mock ).mockReturnValue( { data: undefined } );
		( usePayout as jest.Mock ).mockReturnValue( { data: { paypal: '', tosSigned: false } } );
		( useSavePayout as jest.Mock ).mockReturnValue( {
			mutateAsync: acceptTerms,
			isPending: false,
			isError: false,
		} );
	} );

	it.each( [
		[ 'accepts the terms before turning ads on', { tosSigned: false }, true, false, 1 ],
		[ 'turns ads on when the terms cannot be accepted', { tosSigned: false }, false, false, 1 ],
		[ 'turns ads on straight away once the terms are signed', { tosSigned: true }, true, false, 0 ],
		[ 'turns ads on before the payout details load', undefined, true, false, 0 ],
		[
			'turns ads on and signs the terms in one save on Simple',
			{ tosSigned: false },
			true,
			true,
			0,
		],
	] )( '%s', async ( _name, payout, accepted, simple, signs ) => {
		mockSimple = simple;
		( usePayout as jest.Mock ).mockReturnValue( { data: payout && { paypal: '', ...payout } } );
		if ( ! accepted ) {
			acceptTerms.mockRejectedValue( new Error() );
		}
		renderTab( {}, { wordads: false } );
		const { setModuleActive } = ( useAdsSettings as jest.Mock ).mock.results.at( -1 ).value;

		await userEvent.click( screen.getByRole( 'switch', { name: SWITCH } ) );
		await act( () => Promise.resolve() );

		expect( acceptTerms ).toHaveBeenCalledTimes( signs );
		expect( setModuleActive ).toHaveBeenCalledWith( true );
	} );

	it.each( [
		[ 'the upgrade prompt without a plan', { hasWordAds: false }, [], 'Upgrade', MOCK_UPGRADE_URL ],
		[
			'the connect prompt without a plan or owner',
			{ hasWordAds: false, hasConnectedOwner: false },
			[],
			'Connect',
			'#connect',
		],
		[
			'the upgrade prompt when WordPress.com cannot say',
			{ hasWordAds: false },
			new Error(),
			'Upgrade',
			MOCK_UPGRADE_URL,
		],
	] )( 'shows %s', async ( _label, data, features, name, href ) => {
		renderTab( data, {}, features );

		await expect( screen.findByRole( 'link', { name } ) ).resolves.toHaveAttribute( 'href', href );
		expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'with a plan', {}, [] ],
		[ 'when the cached plan missed a purchase', { hasWordAds: false }, [ 'wordads' ] ],
	] )( 'shows the Ads switch %s', async ( _label, data, features ) => {
		renderTab( data, {}, features );

		await expect( screen.findByRole( 'switch', { name: SWITCH } ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'shows', 5, true ],
		[ 'hides', 0, false ],
	] )(
		'%s the payout card without a plan when the site is owed %d',
		async ( _label, owed, shown ) => {
			( useAdsEarnings as jest.Mock ).mockReturnValue( { data: { owed } } );
			renderTab( { hasWordAds: false } );

			await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( 'Payout card' ) !== null ).toBe( shown );
		}
	);

	it( 'asks WordPress.com only when the cached plan lacks WordAds', async () => {
		renderTab();

		await expect( screen.findByRole( 'switch', { name: SWITCH } ) ).resolves.toBeInTheDocument();
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'locks the Ads switch the host forces, and says why', () => {
		renderTab( { moduleOverride: 'active' } );

		expect( screen.getByRole( 'switch', { name: SWITCH } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByText( 'Enabled by your host or site administrator.' ) ).toBeInTheDocument();
	} );

	it( 'offers no upgrade when the host keeps ads off', async () => {
		renderTab( { hasWordAds: false, moduleOverride: 'inactive' } );

		await expect(
			screen.findByText( 'Disabled by your host or site administrator.' )
		).resolves.toBeVisible();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
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

	it( 'shows Simple’s own options, and none it cannot save', () => {
		mockSimple = true;
		renderTab();

		expect(
			screen.getByRole( 'switch', { name: 'Only show ads to logged-out visitors' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'switch', { name: 'Sidebar' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'switch', { name: 'Enable GDPR Consent Banner' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'switch', { name: 'Customize your ads.txt file' } )
		).not.toBeInTheDocument();
	} );

	it( 'lets the owner of a Simple site join WordAds in place', async () => {
		mockSimple = true;
		( useAdsAccount as jest.Mock ).mockReturnValue( {
			data: { approved: false },
			isPending: false,
		} );
		renderTab();

		expect( screen.queryByRole( 'switch', { name: SWITCH } ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Join WordAds' } ) );
		expect( mockJoin ).toHaveBeenCalled();
		expect( openTab ).not.toHaveBeenCalled();
	} );

	it( 'says why the owner cannot join when WordPress.com reports the site unsafe', () => {
		mockSimple = true;
		( useAdsAccount as jest.Mock ).mockReturnValue( {
			data: { approved: false, unsafe: 'mature' },
			isPending: false,
		} );
		renderTab();

		expect( screen.getByText( /identified as serving mature content/ ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Join WordAds' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'tells an admin who is not the owner that only the owner can join', () => {
		mockSimple = true;
		mockCanJoin = false;
		( useAdsAccount as jest.Mock ).mockReturnValue( {
			data: { approved: false },
			isPending: false,
		} );
		renderTab();

		expect( screen.getByText( /Only the site owner can join WordAds/ ) ).toBeVisible();
		expect( screen.queryByRole( 'button', { name: 'Join WordAds' } ) ).not.toBeInTheDocument();
	} );

	it( 'opens the Ads tab in place for earnings', async () => {
		renderTab();
		const link = screen.getByRole( 'link', { name: 'View your earnings' } );

		expect( link ).toHaveAttribute( 'href', 'admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dads' );
		await userEvent.click( link );
		expect( openTab ).toHaveBeenCalledWith( 'ads' );
	} );
} );
