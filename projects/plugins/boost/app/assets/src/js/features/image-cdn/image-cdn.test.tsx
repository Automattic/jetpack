/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- The legacy Boost Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { MODERN_ROOT_ID } from '$lib/modern/mode';
import { useSingleModuleState } from '$features/module/lib/stores';
import ImageCdn from './image-cdn';
import type { ReactNode } from 'react';

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
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: () => [] } ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

test( 'routes the modern Image CDN notice to the upgrade page without inline license redemption', () => {
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, addLicense: true, host: 'unknown' } },
	} );
	jest.mocked( useSingleModuleState ).mockReturnValue( [ { available: false }, jest.fn() ] );
	render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
	render(
		<ModuleSurfaceProvider value="row">
			<ImageCdn />
		</ModuleSurfaceProvider>,
		{ container: screen.getByTestId( 'dashboard-root' ) }
	);

	expect( screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' ) ).toBe(
		'admin.php?page=my-jetpack#/add-boost'
	);
	expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
	expect( screen.queryByRole( 'dialog' ) ).toBeNull();
} );
