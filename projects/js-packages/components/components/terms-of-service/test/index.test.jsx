import { render, screen } from '@testing-library/react';
import TermsOfService from '..';

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

	it( 'links to the Terms of Service document (single button)', () => {
		render( <TermsOfService agreeButtonLabel={ 'whatever' } /> );
		expect( screen.getByText( 'Terms of Service', { selector: 'a' } ) ).toBeInTheDocument();
	} );

	it( 'links to the Terms of Service document (multiple buttons)', () => {
		render( <TermsOfService multipleButtons /> );
		expect( screen.getByText( 'Terms of Service', { selector: 'a' } ) ).toBeInTheDocument();
	} );

	it( 'links to the data sharing document (single button)', () => {
		render( <TermsOfService agreeButtonLabel={ 'whatever' } /> );
		expect( screen.getByText( 'share details', { selector: 'a' } ) ).toBeInTheDocument();
	} );

	it( 'links to the data sharing document (multiple buttons)', () => {
		render( <TermsOfService multipleButtons /> );
		expect( screen.getByText( 'share details', { selector: 'a' } ) ).toBeInTheDocument();
	} );
} );
