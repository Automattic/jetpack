/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import GettingStarted from './getting-started';

jest.mock( '$features/boost-pricing-table/boost-pricing-table', () => ( {
	BoostPricingTable: () => <button>Get Boost</button>,
} ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: jest.fn( () => [] ) } ) );
jest.mock( '$lib/stores/connection', () => ( {
	getUpgradeURL: jest.fn(),
	useConnection: () => ( { connection: {}, initializeConnection: jest.fn() } ),
} ) );
jest.mock( '$lib/stores/getting-started', () => ( {
	useGettingStarted: () => ( { shouldGetStarted: true, markGettingStartedComplete: jest.fn() } ),
} ) );
jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: jest.fn() } ),
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ false, jest.fn() ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

test.each( [
	{ rootId: MODERN_ROOT_ID, features: [], links: 1, linkStyled: true },
	{ rootId: MODERN_ROOT_ID, features: [ 'support' ], links: 0, linkStyled: false },
	{ rootId: LEGACY_ROOT_ID, features: [], links: 1, linkStyled: false },
] )(
	'offers license redemption beside the pricing table on modern free sites (%o)',
	( { rootId, features, links, linkStyled } ) => {
		Object.assign( globalThis, {
			Jetpack_Boost: {
				site: {
					domain: 'example.com',
					online: true,
					myJetpack: true,
					addLicense: true,
					host: 'unknown',
				},
			},
		} );
		jest.mocked( usePremiumFeatures ).mockReturnValue( features );
		render( <div id={ rootId } data-testid="dashboard-root" /> );
		render( <GettingStarted />, { container: screen.getByTestId( 'dashboard-root' ) } );

		expect( screen.getByRole( 'button', { name: 'Get Boost' } ) ).toBeTruthy();
		const found = screen.queryAllByRole( 'link', { name: 'Use license key' } );
		expect( found ).toHaveLength( links );
		expect( found[ 0 ]?.getAttribute( 'href' ) ).toBe(
			links ? 'admin.php?page=my-jetpack#/add-license' : undefined
		);
		expect( found[ 0 ]?.classList.contains( 'is-link' ) ).toBe( links ? linkStyled : undefined );
	}
);

test.each( [
	{ rootId: LEGACY_ROOT_ID, myJetpack: false, addLicense: true },
	{ rootId: MODERN_ROOT_ID, myJetpack: false, addLicense: true },
	{ rootId: LEGACY_ROOT_ID, myJetpack: true, addLicense: false },
	{ rootId: MODERN_ROOT_ID, myJetpack: true, addLicense: false },
] )( 'hides unavailable license screens (%o)', ( { rootId, myJetpack, addLicense } ) => {
	Object.assign( globalThis, {
		Jetpack_Boost: {
			site: { domain: 'example.com', online: true, myJetpack, addLicense, host: 'unknown' },
		},
	} );
	jest.mocked( usePremiumFeatures ).mockReturnValue( [] );
	render( <div id={ rootId } data-testid="dashboard-root" /> );
	render( <GettingStarted />, { container: screen.getByTestId( 'dashboard-root' ) } );
	expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
} );
