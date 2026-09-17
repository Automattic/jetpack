/* eslint-disable jest-dom/prefer-in-document */
import apiFetch from '@wordpress/api-fetch';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import InterstitialModalCTA from './interstitial-modal-cta';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( '$lib/stores/pricing', () => ( { usePricing: () => null } ) );
jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: jest.fn( () => [] ),
} ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

const boostGlobal = { site: { online: true } };

describe( 'InterstitialModalCTA', () => {
	beforeEach( () => {
		jest.mocked( apiFetch ).mockClear();
		jest.mocked( apiFetch ).mockImplementation( () => new Promise( () => {} ) );
		Object.assign( globalThis, {
			Jetpack_Boost: boostGlobal,
			myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
			JP_CONNECTION_INITIAL_STATE: {},
		} );
	} );

	it( 'requests My Jetpack products and opens the upgrade prompt on a public site', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( {
			boost: {
				slug: 'boost',
				title: 'Boost',
				pricing_for_ui: {
					tiers: {
						upgraded: {
							full_price: 120,
							discount_price: 120,
							currency_code: 'USD',
							product_term: 'year',
						},
					},
				},
			},
		} );
		boostGlobal.site.online = true;
		render( <InterstitialModalCTA identifier="cornerstone-10-pages" description="Upgrade" /> );

		expect( screen.getByRole( 'button', { name: /Upgrade now/ } ) ).toBeTruthy();
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: 'my-jetpack/v1/site/products' } )
		);
		// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
		fireEvent.click( screen.getByRole( 'button', { name: /Upgrade now/ } ) );
		const modal = await screen.findByRole( 'dialog' );
		await waitFor( () => {
			// eslint-disable-next-line jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom.
			expect(
				within( modal ).getByRole( 'button', { name: 'Upgrade now' } ).hasAttribute( 'disabled' )
			).toBe( false );
		} );
		expect( within( modal ).getByText( 'Automated critical CSS generation' ) ).toBeTruthy();
	} );

	it( 'makes no My Jetpack request on an offline site', () => {
		boostGlobal.site.online = false;
		render( <InterstitialModalCTA identifier="cornerstone-10-pages" description="Upgrade" /> );

		expect( screen.queryByRole( 'button' ) ).toBeNull();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it.each( [
		{ rootId: MODERN_ROOT_ID, features: [], visible: true },
		{ rootId: MODERN_ROOT_ID, features: [ 'support' ], visible: false },
		{ rootId: LEGACY_ROOT_ID, features: [], visible: false },
	] )( 'offers license redemption beside modern free-site prompts (%o)', ( {
		rootId,
		features,
		visible,
	} ) => {
		boostGlobal.site.online = true;
		jest.mocked( usePremiumFeatures ).mockReturnValue( features );
		render( <div id={ rootId } data-testid="dashboard-root" /> );
		render( <InterstitialModalCTA identifier="critical-css" description="Upgrade" />, {
			container: screen.getByTestId( 'dashboard-root' ),
		} );

		expect( screen.getByRole( 'button', { name: /Upgrade now/ } ) ).toBeTruthy();
		const link = screen.queryByRole( 'link', { name: 'Use license key' } );
		expect( link?.getAttribute( 'href' ) ).toBe(
			visible ? 'admin.php?page=my-jetpack#/add-license' : undefined
		);
	} );
} );
