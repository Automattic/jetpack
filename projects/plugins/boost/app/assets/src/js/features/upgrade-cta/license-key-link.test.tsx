/* eslint-disable jest-dom/prefer-in-document */
import { render, screen } from '@testing-library/react';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import LicenseKeyLink from './license-key-link';

jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: jest.fn( () => [] ),
} ) );

const boostGlobal = { site: { online: true, myJetpack: true, addLicense: true, host: 'unknown' } };

describe( 'LicenseKeyLink', () => {
	beforeEach( () => {
		Object.assign( boostGlobal.site, {
			online: true,
			myJetpack: true,
			addLicense: true,
			host: 'unknown',
		} );
		jest.mocked( usePremiumFeatures ).mockReturnValue( [] );
		Object.assign( globalThis, { Jetpack_Boost: boostGlobal } );
	} );

	it.each( [ 'myJetpack', 'addLicense' ] as const )(
		'hides the link when %s is unavailable',
		flag => {
			boostGlobal.site[ flag ] = false;
			render( <div id={ MODERN_ROOT_ID } data-testid="dashboard-root" /> );
			render( <LicenseKeyLink />, { container: screen.getByTestId( 'dashboard-root' ) } );
			expect( screen.queryByRole( 'link' ) ).toBeNull();
		}
	);

	it.each( [
		{ rootId: MODERN_ROOT_ID, features: [], host: 'unknown', visible: true },
		{ rootId: MODERN_ROOT_ID, features: [ 'support' ], host: 'unknown', visible: false },
		{ rootId: MODERN_ROOT_ID, features: [], host: 'woa', visible: false },
		{ rootId: LEGACY_ROOT_ID, features: [], host: 'unknown', visible: false },
	] )(
		'offers license redemption only to eligible modern sites (%o)',
		( { rootId, features, host, visible } ) => {
			boostGlobal.site.host = host;
			jest.mocked( usePremiumFeatures ).mockReturnValue( features );
			render( <div id={ rootId } data-testid="dashboard-root" /> );
			render( <LicenseKeyLink />, { container: screen.getByTestId( 'dashboard-root' ) } );

			const link = screen.queryByRole( 'link', { name: 'Use license key' } );
			expect( link?.getAttribute( 'href' ) ).toBe(
				visible ? 'admin.php?page=my-jetpack#/add-license' : undefined
			);
		}
	);
} );
