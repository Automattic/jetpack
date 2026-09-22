/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { MODERN_ROOT_ID } from '$lib/modern/mode';
import CriticalCssModule from './critical-css-module';
import type { ReactNode } from 'react';

const mockRegenerate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( {
		description,
		children,
		onEnable,
	}: {
		description: ReactNode;
		children: ReactNode;
		onEnable?: () => void;
	} ) => (
		<section data-testid="module-card">
			<button onClick={ onEnable }>Enable</button>
			{ description }
			{ children }
		</section>
	),
} ) );
jest.mock( '$features/critical-css/critical-css-meta/critical-css-meta', () => () => null );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '$lib/stores/pricing', () => ( { usePricing: () => null } ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: () => [] } ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

test( 'shows one license link in the Critical CSS card with its premium tooltip open', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, addLicense: true, host: 'unknown' } },
		myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
		JP_CONNECTION_INITIAL_STATE: {},
	} );
	render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
	render( <CriticalCssModule />, { container: screen.getByTestId( 'dashboard-root' ) } );

	const card = screen.getByTestId( 'module-card' );
	// eslint-disable-next-line testing-library/prefer-user-event -- The tooltip opens on mousedown, and this project does not provide user-event.
	fireEvent.mouseDown( within( card ).getAllByRole( 'button' )[ 1 ] );

	expect( within( card ).getByText( 'Manual Critical CSS regeneration' ) ).toBeTruthy();
	expect( within( card ).getAllByRole( 'link', { name: 'Use license key' } ) ).toHaveLength( 1 );
} );

test.each( [ 'row', 'block' ] as const )(
	'enabling manual CSS on the %s surface preserves its generation behavior',
	surface => {
		mockRegenerate.mockClear();
		Object.assign( globalThis, {
			Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'unknown' } },
		} );
		render(
			<ModuleSurfaceProvider value={ surface }>
				<CriticalCssModule />
			</ModuleSurfaceProvider>
		);
		// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
		fireEvent.click( screen.getByRole( 'button', { name: 'Enable' } ) );
		expect( mockRegenerate ).toHaveBeenCalledTimes( surface === 'row' ? 0 : 1 );
	}
);

test( 'preserves the legacy Critical CSS upsell description and monthly price', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, host: 'unknown' } },
		myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
		JP_CONNECTION_INITIAL_STATE: {},
	} );
	render(
		<ModuleSurfaceProvider value="block">
			<CriticalCssModule />
		</ModuleSurfaceProvider>
	);
	expect(
		screen.getByRole( 'button', {
			name: /Save time by upgrading to Automatic Critical CSS generation\. Upgrade now only _ per month/,
		} )
	).toBeTruthy();
} );
