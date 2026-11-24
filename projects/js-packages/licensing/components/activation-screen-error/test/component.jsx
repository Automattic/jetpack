import { render, screen } from '@testing-library/react';
import ActivationScreenError from '../index';

// The @wordpress/ui Notice announces its message via the a11y speak() region,
// which duplicates the text into a hidden node — so assert on getAllByText.

describe( 'ActivationScreenError', () => {
	it( 'renders nothing without an error', () => {
		const { container } = render( <ActivationScreenError licenseError="" errorType={ null } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows a generic error message with a support link', () => {
		render( <ActivationScreenError licenseError="Something went wrong" errorType={ null } /> );
		expect( screen.getAllByText( 'Something went wrong' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByRole( 'link', { name: /get in touch/i } ) ).toBeInTheDocument();
	} );

	it( 'renders the ordered resolution steps for a not-same-owner error', () => {
		render(
			<ActivationScreenError licenseError="[not_same_owner]" errorType="[not_same_owner]" />
		);
		expect( screen.getAllByText( /account that purchased the plan/i ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Disconnect Jetpack from your site.' ).length ).toBeGreaterThan(
			0
		);
		expect( screen.getAllByText( 'Reconnect Jetpack.' ).length ).toBeGreaterThan( 0 );
	} );

	it( 'renders a success message when the license is already active on the site', () => {
		render(
			<ActivationScreenError
				licenseError="[active_on_same_site]"
				errorType="[active_on_same_site]"
			/>
		);
		expect(
			screen.getAllByText( 'This license is already active on your site.' ).length
		).toBeGreaterThan( 0 );
	} );

	it.each( [
		[ '[jetpack_pro_lower_limits]', /higher limits than Jetpack Pro/ ],
		[ '[jetpack_pro_other_owner]', /belongs to another WordPress\.com account/ ],
		[ '[product_incompatibility]', /active Jetpack plan of equal or higher value/ ],
	] )( 'shows translated copy, not the server text, for %s', ( errorType, expected ) => {
		render(
			<ActivationScreenError
				licenseError={ `Jetpack: ${ errorType } Server reason.` }
				errorType={ errorType }
			/>
		);
		expect( screen.getAllByText( expected ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( /Server reason/ ) ).not.toBeInTheDocument();
	} );
} );
