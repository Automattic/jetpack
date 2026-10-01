/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- The legacy Boost Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { useSingleModuleState } from '$features/module/lib/stores';
import ImageCdn from './image-cdn';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <section>{ children }</section>,
} ) );
jest.mock( '$features/module/lib/stores', () => ( { useSingleModuleState: jest.fn() } ) );
jest.mock( '$features/image-cdn/image-cdn-liar/image-cdn-liar', () => () => null );
jest.mock( '$features/image-cdn/quality-settings/quality-settings', () => () => null );
jest.mock( '$lib/stores/pricing', () => ( { usePricing: () => null } ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: () => [] } ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

test( 'routes the modern Image CDN notice to the upgrade page without inline license redemption', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, addLicense: true, host: 'unknown' } },
		myJetpackInitialState: { products: { items: { boost: { slug: 'boost', title: 'Boost' } } } },
		JP_CONNECTION_INITIAL_STATE: {},
	} );
	jest.mocked( useSingleModuleState ).mockReturnValue( [ { available: false }, jest.fn() ] );
	render(
		<ModuleSurfaceProvider value="row">
			<ImageCdn />
		</ModuleSurfaceProvider>
	);

	expect( screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' ) ).toBe(
		'admin.php?page=my-jetpack#/add-boost'
	);
	expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
	expect( screen.queryByRole( 'dialog' ) ).toBeNull();
} );
