import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const getUpsellUrl = jest.fn< () => string >();

jest.unstable_mockModule( '../../data/is-gated', () => ( { getUpsellUrl } ) );

const { default: UpsellBanner } = await import( '../upsell-banner' );

describe( 'UpsellBanner', () => {
	it( 'hides the upgrade offer when checkout is unavailable', () => {
		getUpsellUrl.mockReturnValue( '' );

		const { container } = render( <UpsellBanner /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'opens checkout in the same tab when an upgrade is available', () => {
		const url = 'https://wordpress.com/checkout/example.wordpress.com/value_bundle';
		getUpsellUrl.mockReturnValue( url );

		render( <UpsellBanner /> );

		const upgradeLink = screen.getByRole( 'link', { name: /^Upgrade/ } );
		expect( upgradeLink ).toHaveAttribute( 'href', url );
		expect( upgradeLink ).not.toHaveAttribute( 'target', '_blank' );
	} );
} );
