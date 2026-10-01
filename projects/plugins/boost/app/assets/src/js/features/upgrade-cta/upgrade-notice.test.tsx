/* eslint-disable testing-library/prefer-user-event -- This Jest project does not provide user-event. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom. */
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { recordBoostEvent, recordBoostEventAndRedirect } from '$lib/utils/analytics';
import UpgradeNotice from './upgrade-notice';

jest.mock( '$lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
	recordBoostEventAndRedirect: jest.fn(),
} ) );
jest.mock(
	'@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp',
	() => ''
);
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

beforeEach( () => {
	jest.clearAllMocks();
	Object.assign( globalThis, {
		Jetpack_Boost: { site: { online: true, myJetpack: true, addLicense: true, host: 'other' } },
	} );
} );

function renderNotice( identifier = 'critical-css' ) {
	render(
		<ModuleSurfaceProvider value="row">
			<UpgradeNotice identifier={ identifier } description="Upgrade description." />
		</ModuleSurfaceProvider>
	);
}

test.each( [ 'critical-css', 'image-cdn', 'cornerstone-10-pages' ] )(
	'%s navigates through tracking and leaves redemption on the upgrade page',
	identifier => {
		renderNotice( identifier );
		const link = screen.getByRole( 'link', { name: 'Upgrade now' } );
		expect( link.getAttribute( 'href' ) ).toBe( 'admin.php?page=my-jetpack#/add-boost' );
		expect( fireEvent.click( link ) ).toBe( false );
		expect( recordBoostEventAndRedirect ).toHaveBeenCalledWith(
			'admin.php?page=my-jetpack#/add-boost',
			'upsell_cta_from_settings_page_in_plugin',
			{ identifier }
		);
		expect( screen.queryByRole( 'link', { name: 'Use license key' } ) ).toBeNull();
		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
	}
);

test.each( [ 'metaKey', 'ctrlKey', 'shiftKey', 'altKey' ] )(
	'preserves native %s navigation while recording the settings event',
	modifier => {
		renderNotice();
		const observeClick = jest.fn( ( event: Event ) => {
			const prevented = event.defaultPrevented;
			event.preventDefault();
			return prevented;
		} );
		document.addEventListener( 'click', observeClick, { once: true } );
		fireEvent.click( screen.getByRole( 'link', { name: 'Upgrade now' } ), { [ modifier ]: true } );
		expect( observeClick ).toHaveReturnedWith( false );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'upsell_cta_from_settings_page_in_plugin', {
			identifier: 'critical-css',
		} );
		expect( recordBoostEventAndRedirect ).not.toHaveBeenCalled();
	}
);

test.each( [ 'online', 'myJetpack' ] as const )( 'hides notices when %s is unavailable', flag => {
	Jetpack_Boost.site[ flag ] = false;
	renderNotice();
	expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).toBeNull();
	expect( screen.queryByText( 'Upgrade description.' ) ).toBeNull();
} );
