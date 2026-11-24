import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockUseSiteVerify = jest.fn();

jest.unstable_mockModule( '../../../data/use-site-verify', () => ( {
	useSiteVerify: mockUseSiteVerify,
} ) );

const { default: SiteVerificationField } = await import( '../site-verification-field' );
const { SITE_VERIFY_SERVICES } = await import( '../../../data/site-verify-services' );

const siteVerifyDefaults = {
	state: 'unverified',
	canAutoVerify: true,
	isOwner: false,
	toolsUrl: '',
	isVerifying: false,
	isConfirming: false,
	autoVerify: jest.fn(),
};

describe.each( [
	[ 'google', 'Google' ],
	[ 'bing', 'Bing' ],
] as const )( 'SiteVerificationField (%s)', ( key, label ) => {
	const service = SITE_VERIFY_SERVICES[ key ];
	const renderField = ( value = '' ) =>
		render(
			<SiteVerificationField
				service={ service }
				value={ value }
				onChange={ jest.fn() }
				saveCode={ jest.fn< ( code: string ) => Promise< void > >() }
			/>
		);
	const manualCode = () => screen.getByRole( 'textbox', { name: service.strings.codeLabel } );

	beforeEach( () => {
		mockUseSiteVerify.mockReturnValue( siteVerifyDefaults );
	} );

	it( 'names its controls as a group', () => {
		renderField();

		// The service name is styled as a field label (`heading-sm`, 11px uppercase) to match
		// the code-only services, but here it heads several controls rather than labelling
		// one input. Without the group it would read as a label attached to nothing.
		expect( screen.getByRole( 'group', { name: label } ) ).toBeInTheDocument();
		expect( screen.getByText( label ).className ).toMatch( /heading-sm/ );
	} );

	it( 'shows the manual field, but not the manual button, when a value exists', () => {
		renderField( 'saved-code' );

		expect( manualCode() ).toHaveValue( 'saved-code' );
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: service.strings.verify } ) ).toBeInTheDocument();
	} );

	it( 'keeps the manual code editable while the popup is open, so a blocked popup leaves a way in', () => {
		mockUseSiteVerify.mockReturnValue( { ...siteVerifyDefaults, isVerifying: true } );
		renderField( 'saved-code' );

		expect( manualCode() ).toBeEnabled();
	} );

	it( 'locks the manual code once the popup returns, so a typed code cannot replace the token', () => {
		mockUseSiteVerify.mockReturnValue( {
			...siteVerifyDefaults,
			isVerifying: true,
			isConfirming: true,
		} );
		renderField( 'saved-code' );

		expect( manualCode() ).toBeDisabled();
	} );

	it( 'reveals the manual field and removes the manual button', () => {
		renderField();

		const manualButton = screen.getByRole( 'button', { name: /Enter a code manually/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( manualButton );

		expect( manualCode() ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the manual field mounted when its value is cleared', () => {
		const { rerender } = renderField( 'saved-code' );

		// Simulate the controlled parent clearing the value mid-edit.
		rerender(
			<SiteVerificationField
				service={ service }
				value=""
				onChange={ jest.fn() }
				saveCode={ jest.fn< ( code: string ) => Promise< void > >() }
			/>
		);

		expect( manualCode() ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
	} );

	it( "shows only the verified state, linking owners to the service's dashboard", () => {
		mockUseSiteVerify.mockReturnValue( {
			...siteVerifyDefaults,
			state: 'verified',
			isOwner: true,
			toolsUrl: 'https://example.com/tools',
		} );

		renderField();

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Verified' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: new RegExp( service.strings.toolsLink ) } )
		).toHaveAttribute( 'href', 'https://example.com/tools' );
	} );
} );
