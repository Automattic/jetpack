/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { fireEvent, render, screen } from '@testing-library/react';
import { cloneElement as mockCloneElement } from 'react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { recordBoostEvent } from '$lib/utils/analytics';
import InterstitialModalCTA from './interstitial-modal-cta';

const mockOpenModal = jest.fn();
jest.mock( '@automattic/jetpack-my-jetpack/components/product-interstitial-modal/index', () => ( {
	ProductInterstitialMyJetpack: ( { slug, customModalTrigger } ) =>
		mockCloneElement( customModalTrigger, { onClick: () => mockOpenModal( slug ) } ),
} ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( './license-key-link', () => () => null );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '$lib/stores/pricing', () => ( {
	usePricing: () => ( { priceAfter: 120, currencyCode: 'USD' } ),
} ) );

beforeEach( () => {
	jest.clearAllMocks();
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'unknown' } },
	} );
} );

test.each( [ 'critical-css', 'image-cdn', 'cornerstone-10-pages' ] )(
	'%s notice opens the Boost interstitial with unchanged tracking and no price',
	identifier => {
		render(
			<ModuleSurfaceProvider value="row">
				<InterstitialModalCTA identifier={ identifier } description="Upgrade description." />
			</ModuleSurfaceProvider>
		);
		expect(
			screen.getByText( 'Upgrade description.', { selector: 'span' } ).parentElement?.className
		).toContain( 'is-info' );
		expect( screen.queryByText( /per month|\$10/ ) ).toBeNull();
		// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
		fireEvent.click( screen.getByRole( 'button', { name: 'Upgrade now' } ) );
		expect( mockOpenModal ).toHaveBeenCalledWith( 'boost' );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'upsell_cta_from_settings_page_in_plugin', {
			identifier,
		} );
	}
);

test( 'keeps the legacy monthly price', () => {
	render( <InterstitialModalCTA identifier="critical-css" description="Upgrade description." /> );
	expect(
		screen.getByRole( 'button', { name: /Upgrade now only \$10\.00 per month/ } )
	).toBeTruthy();
} );

test( 'hides the modern upsell on offline sites', () => {
	Jetpack_Boost.site.online = false;
	render(
		<ModuleSurfaceProvider value="row">
			<InterstitialModalCTA identifier="critical-css" description="Upgrade description." />
		</ModuleSurfaceProvider>
	);
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).toBeNull();
} );
