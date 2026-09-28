/* eslint-disable jest-dom/prefer-in-document */
import apiFetch from '@wordpress/api-fetch';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import InterstitialModalCTA from './interstitial-modal-cta';
import LicenseKeyLink from './license-key-link';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( './upgrade-cta.module.scss', () => ( { 'license-key-link': 'license-key-link' } ) );
jest.mock( '$lib/stores/pricing', () => ( { usePricing: () => null } ) );
jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: jest.fn( () => [] ),
} ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

const boostGlobal = { site: { online: true, myJetpack: true, addLicense: true, host: 'unknown' } };

describe( 'InterstitialModalCTA', () => {
	beforeEach( () => {
		jest.mocked( apiFetch ).mockClear();
		jest.mocked( apiFetch ).mockImplementation( () => new Promise( () => {} ) );
		Object.assign( boostGlobal.site, {
			online: true,
			myJetpack: true,
			addLicense: true,
			host: 'unknown',
		} );
		jest.mocked( usePremiumFeatures ).mockReturnValue( [] );
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

	it.each( [ LEGACY_ROOT_ID, MODERN_ROOT_ID ] )(
		'hides prompts when My Jetpack is unavailable (%s)',
		rootId => {
			boostGlobal.site.myJetpack = false;
			render( <div id={ rootId } data-testid="dashboard-root" /> );
			render( <InterstitialModalCTA identifier="critical-css" showLicenseKeyLink />, {
				container: screen.getByTestId( 'dashboard-root' ),
			} );
			expect( screen.queryByRole( 'button' ) ).toBeNull();
			expect( screen.queryByRole( 'link' ) ).toBeNull();
			expect( screen.queryByRole( 'dialog' ) ).toBeNull();
			expect( apiFetch ).not.toHaveBeenCalled();
		}
	);

	it( 'keeps the upsell when the add-license screen is disabled', () => {
		boostGlobal.site.addLicense = false;
		render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
		render( <InterstitialModalCTA identifier="critical-css" showLicenseKeyLink />, {
			container: screen.getByTestId( 'dashboard-root' ),
		} );
		expect( screen.getByRole( 'button', { name: /Upgrade now/ } ) ).toBeTruthy();
		expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
	} );

	it( 'hides a standalone license link when My Jetpack is unavailable', () => {
		boostGlobal.site.myJetpack = false;
		render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
		render( <LicenseKeyLink />, { container: screen.getByTestId( 'dashboard-root' ) } );
		expect( screen.queryByRole( 'link' ) ).toBeNull();
	} );

	it.each( [
		{ rootId: MODERN_ROOT_ID, features: [], host: 'unknown', visible: true },
		{ rootId: MODERN_ROOT_ID, features: [ 'support' ], host: 'unknown', visible: false },
		{ rootId: MODERN_ROOT_ID, features: [], host: 'woa', visible: false },
		{ rootId: LEGACY_ROOT_ID, features: [], host: 'unknown', visible: false },
	] )(
		'offers license redemption beside modern free-site prompts (%o)',
		( { rootId, features, host, visible } ) => {
			boostGlobal.site.online = true;
			boostGlobal.site.host = host;
			jest.mocked( usePremiumFeatures ).mockReturnValue( features );
			render( <div id={ rootId } data-testid="dashboard-root" /> );
			render(
				<InterstitialModalCTA identifier="critical-css" description="Upgrade" showLicenseKeyLink />,
				{
					container: screen.getByTestId( 'dashboard-root' ),
				}
			);

			expect( screen.getByRole( 'button', { name: /Upgrade now/ } ) ).toBeTruthy();
			const link = screen.queryByRole( 'link', { name: 'Use license key' } );
			expect( link?.getAttribute( 'href' ) ).toBe(
				visible ? 'admin.php?page=my-jetpack#/add-license' : undefined
			);
			// The wrapper keeps the click target at the text's width.
			expect( link?.parentElement.className ).toBe( visible ? 'license-key-link' : undefined );
		}
	);
} );
