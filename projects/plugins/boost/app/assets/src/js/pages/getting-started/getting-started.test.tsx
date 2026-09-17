/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import GettingStarted from './getting-started';
import type { ReactNode } from 'react';

jest.mock( '$layout/boost-admin-page/boost-admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );
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
	{ rootId: MODERN_ROOT_ID, features: [], visible: true },
	{ rootId: MODERN_ROOT_ID, features: [ 'support' ], visible: false },
	{ rootId: LEGACY_ROOT_ID, features: [], visible: false },
] )(
	'offers license redemption beside the pricing table on modern free sites (%o)',
	( { rootId, features, visible } ) => {
		Object.assign( globalThis, {
			Jetpack_Boost: { site: { domain: 'example.com', online: true, host: 'unknown' } },
		} );
		jest.mocked( usePremiumFeatures ).mockReturnValue( features );
		render( <div id={ rootId } data-testid="dashboard-root" /> );
		render( <GettingStarted />, { container: screen.getByTestId( 'dashboard-root' ) } );

		expect( screen.getByRole( 'button', { name: 'Get Boost' } ) ).toBeTruthy();
		const link = screen.queryByRole( 'link', { name: 'Use license key' } );
		expect( link?.getAttribute( 'href' ) ).toBe(
			visible ? 'admin.php?page=my-jetpack#/add-license' : undefined
		);
	}
);
