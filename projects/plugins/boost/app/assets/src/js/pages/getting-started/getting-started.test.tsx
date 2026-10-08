/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
/* eslint-disable testing-library/prefer-user-event -- This project does not provide user-event. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { getUpgradeURL } from '$lib/stores/connection';
import { useGettingStarted } from '$lib/stores/getting-started';
import { recordBoostEvent } from '$lib/utils/analytics';
import GettingStarted from './getting-started';

jest.mock( '$features/boost-pricing-table/boost-pricing-table', () => ( {
	BoostPricingTable: ( { onPremiumCTA }: { onPremiumCTA: () => void } ) => (
		<button onClick={ onPremiumCTA }>Get Boost</button>
	),
} ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: jest.fn( () => [] ) } ) );
jest.mock( '$lib/stores/connection', () => ( {
	getUpgradeURL: jest.fn( () => '#checkout' ),
	useConnection: () => ( {
		connection: { userConnected: true, wpcomBlogId: 123 },
		initializeConnection: jest.fn(),
	} ),
} ) );
jest.mock( '$lib/stores/getting-started', () => ( {
	useGettingStarted: jest.fn(),
} ) );
jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: jest.fn() } ),
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ false, jest.fn() ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );
jest.mock( '../../../../../../_inc/overview/lib/upgrade-bridge', () => ( {
	upgradeHref: '#shared-boost-upgrade',
} ) );

const mockMarkGettingStartedComplete = jest.fn();

beforeEach( () => {
	jest.clearAllMocks();
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=my-jetpack' );
	jest.mocked( useGettingStarted ).mockReturnValue( {
		shouldGetStarted: true,
		markGettingStartedComplete: mockMarkGettingStartedComplete,
	} );
} );

function renderFreeSite(
	rootId = MODERN_ROOT_ID,
	siteOverrides: Partial< typeof Jetpack_Boost.site > = {},
	features: string[] = []
) {
	Object.assign( globalThis, {
		Jetpack_Boost: {
			site: {
				domain: 'example.com',
				online: true,
				myJetpack: true,
				addLicense: true,
				host: 'other',
				...siteOverrides,
			},
		},
	} );
	jest.mocked( usePremiumFeatures ).mockReturnValue( features );
	render( <div id={ rootId } data-testid="dashboard-root" /> );
	return render( <GettingStarted />, { container: screen.getByTestId( 'dashboard-root' ) } );
}

test.each( [
	{ rootId: MODERN_ROOT_ID, features: [], links: 0 },
	{ rootId: LEGACY_ROOT_ID, features: [], links: 1 },
] )(
	'leaves license redemption on the modern upgrade page and preserves the legacy header (%o)',
	( { rootId, features, links } ) => {
		renderFreeSite( rootId, { host: 'unknown' }, features );

		expect( screen.getByRole( 'button', { name: 'Get Boost' } ) ).toBeTruthy();
		const found = screen.queryAllByRole( 'link', { name: 'Use license key' } );
		expect( found ).toHaveLength( links );
		expect( found[ 0 ]?.getAttribute( 'href' ) ).toBe(
			links ? 'admin.php?page=my-jetpack#/add-license' : undefined
		);
	}
);

test.each( [
	{ rootId: LEGACY_ROOT_ID, myJetpack: false, addLicense: true },
	{ rootId: LEGACY_ROOT_ID, myJetpack: true, addLicense: false },
] )( 'hides unavailable license screens (%o)', ( { rootId, myJetpack, addLicense } ) => {
	renderFreeSite( rootId, { myJetpack, addLicense, host: 'unknown' } );
	expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
} );

test.each( [
	{
		rootId: MODERN_ROOT_ID,
		myJetpack: true,
		destination: '#shared-boost-upgrade',
	},
	{
		rootId: MODERN_ROOT_ID,
		myJetpack: false,
		destination: '#checkout',
	},
	{
		rootId: LEGACY_ROOT_ID,
		myJetpack: true,
		destination: '#checkout',
	},
] )(
	'sends the premium selection to its dashboard destination (%o)',
	async ( { rootId, myJetpack, destination } ) => {
		const view = renderFreeSite( rootId, { myJetpack } );
		fireEvent.click( screen.getByRole( 'button', { name: 'Get Boost' } ) );
		await waitFor( () => expect( mockMarkGettingStartedComplete ).toHaveBeenCalled() );
		jest.mocked( useGettingStarted ).mockReturnValue( {
			shouldGetStarted: false,
			markGettingStartedComplete: mockMarkGettingStartedComplete,
		} );
		view.rerender( <GettingStarted /> );
		expect( window.location.hash ).toBe( destination );
		expect( jest.mocked( getUpgradeURL ).mock.calls ).toEqual(
			destination === '#checkout' ? [ [ 'example.com', true, '123' ] ] : []
		);
	}
);

test( 'keeps the modern premium selection tracking event and properties', async () => {
	renderFreeSite();
	fireEvent.click( screen.getByRole( 'button', { name: 'Get Boost' } ) );
	await waitFor( () =>
		expect( recordBoostEvent ).toHaveBeenCalledWith(
			'premium_cta_from_getting_started_page_in_plugin',
			{}
		)
	);
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
} );
