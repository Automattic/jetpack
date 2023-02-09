import { render, screen } from '@testing-library/react';
// Component under test
import TermsOfService from '..';
// Mocks
import { getRedirectUrl } from '../../..';
jest.mock( '../../..', () => ( {
	__esModule: true,
	...jest.requireActual( '../../..' ),
	getRedirectUrl: jest.fn(),
} ) );

describe( 'TermsofService', () => {
	it( "references only 'the buttons above' if multipleButtons is true", () => {
		render( <TermsOfService multipleButtons /> );
		expect(
			screen.getByText(
				( content, { textContent } ) =>
					content !== '' && // filter out parent/wrapper elements
					textContent.startsWith(
						`By clicking the buttons above, you agree to our Terms of Service`
					)
			)
		).toBeInTheDocument();
	} );

	it( 'references the label of the agreement button if one is defined', () => {
		const buttonLabel = 'The best button ever';

		render( <TermsOfService agreeButtonLabel={ buttonLabel } /> );
		expect(
			screen.getByText(
				( content, { textContent } ) =>
					content !== '' && // filter out parent/wrapper elements
					textContent.startsWith(
						`By clicking the ${ buttonLabel } button, you agree to our Terms of Service`
					)
			)
		).toBeInTheDocument();
	} );

	it( 'links to the correct Terms of Service document (single button)', () => {
		const testUrl = 'https://example.com';
		getRedirectUrl.mockReturnValue( testUrl );

		render( <TermsOfService agreeButtonLabel={ 'whatever' } /> );
		expect( screen.getByText( 'Terms of Service', { selector: 'a' } ) ).toHaveAttribute(
			'href',
			testUrl
		);
	} );

	it( 'links to the correct Terms of Service document (multiple buttons)', () => {
		const testUrl = 'https://example.com';
		getRedirectUrl.mockReturnValue( testUrl );

		render( <TermsOfService multipleButtons /> );
		expect( screen.getByText( 'Terms of Service', { selector: 'a' } ) ).toHaveAttribute(
			'href',
			testUrl
		);
	} );

	it( 'links to the correct data sharing document (single button)', () => {
		const testUrl = 'https://example.com';
		getRedirectUrl.mockReturnValue( testUrl );

		render( <TermsOfService agreeButtonLabel={ 'whatever' } /> );
		expect( screen.getByText( 'share details', { selector: 'a' } ) ).toHaveAttribute(
			'href',
			testUrl
		);
	} );

	it( 'links to the correct data sharing document (multiple buttons)', () => {
		const testUrl = 'https://example.com';
		getRedirectUrl.mockReturnValue( testUrl );

		render( <TermsOfService multipleButtons /> );
		expect( screen.getByText( 'share details', { selector: 'a' } ) ).toHaveAttribute(
			'href',
			testUrl
		);
	} );
} );
