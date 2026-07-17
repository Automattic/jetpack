/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock getTranslatedCountryName
await jest.unstable_mockModule( '../../../../../src/util/country-names-translated.js', () => ( {
	getTranslatedCountryName: jest.fn( code => `Country: ${ code }` ),
} ) );

// Import component after mocks are set up
const { default: TextWithFlag } = await import(
	'../../../../../src/dashboard/components/text-with-flag/index.tsx'
);

describe( 'TextWithFlag', () => {
	describe( 'Valid country codes', () => {
		it( 'renders flag emoji for valid 2-letter uppercase code', () => {
			render( <TextWithFlag countryCode="US">Test content</TextWithFlag> );

			const flagElement = screen.getByRole( 'img' );
			expect( flagElement ).toHaveAttribute( 'aria-label', 'Country: US' );
			expect( flagElement ).toHaveTextContent( '🇺🇸' );
		} );

		it( 'renders flag emoji for valid 2-letter lowercase code', () => {
			render( <TextWithFlag countryCode="gb">Test content</TextWithFlag> );

			const flagElement = screen.getByRole( 'img' );
			expect( flagElement ).toHaveAttribute( 'aria-label', 'Country: gb' );
			expect( flagElement ).toHaveTextContent( '🇬🇧' );
		} );

		it( 'renders flag emoji for mixed case code', () => {
			render( <TextWithFlag countryCode="Fr">Test content</TextWithFlag> );

			const flagElement = screen.getByRole( 'img' );
			expect( flagElement ).toHaveTextContent( '🇫🇷' );
		} );

		it( 'always renders children content', () => {
			render( <TextWithFlag countryCode="US">Test content</TextWithFlag> );

			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Invalid country codes - no flag rendered', () => {
		it( 'does not render flag for single character code', () => {
			render( <TextWithFlag countryCode="U">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag for 3+ character code', () => {
			render( <TextWithFlag countryCode="USA">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag for numeric code', () => {
			render( <TextWithFlag countryCode="12">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag for code with special characters', () => {
			render( <TextWithFlag countryCode="U!">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag for code with spaces', () => {
			render( <TextWithFlag countryCode="U ">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Missing country code', () => {
		it( 'does not render flag when countryCode is undefined', () => {
			render( <TextWithFlag countryCode={ undefined }>Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag when countryCode is empty string', () => {
			render( <TextWithFlag countryCode="">Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'does not render flag when countryCode prop is omitted', () => {
			render( <TextWithFlag>Test content</TextWithFlag> );

			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Fallback icon', () => {
		it( 'renders globe icon when fallbackIcon is true and no valid flag', () => {
			const { container } = render(
				<TextWithFlag countryCode={ undefined } fallbackIcon>
					Test content
				</TextWithFlag>
			);

			// Globe icon is rendered with specific class - no Testing Library alternative for class-based SVG queries
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const globeIcon = container.querySelector( '.jp-forms__text-with-flag-globe' );
			expect( globeIcon ).toBeInTheDocument();
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'renders globe icon for invalid country code when fallbackIcon is true', () => {
			const { container } = render(
				<TextWithFlag countryCode="X" fallbackIcon>
					Test content
				</TextWithFlag>
			);

			// Should show globe (invalid code) not flag
			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const globeIcon = container.querySelector( '.jp-forms__text-with-flag-globe' );
			expect( globeIcon ).toBeInTheDocument();
		} );

		it( 'does not render globe icon when fallbackIcon is false', () => {
			const { container } = render(
				<TextWithFlag countryCode={ undefined } fallbackIcon={ false }>
					Test content
				</TextWithFlag>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const globeIcon = container.querySelector( '.jp-forms__text-with-flag-globe' );
			expect( globeIcon ).not.toBeInTheDocument();
		} );

		it( 'does not render globe icon when valid country code exists', () => {
			const { container } = render(
				<TextWithFlag countryCode="US" fallbackIcon>
					Test content
				</TextWithFlag>
			);

			// Should show flag, not globe
			expect( screen.getByRole( 'img' ) ).toHaveTextContent( '🇺🇸' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const globeIcon = container.querySelector( '.jp-forms__text-with-flag-globe' );
			expect( globeIcon ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Children rendering', () => {
		it( 'renders React elements as children', () => {
			render(
				<TextWithFlag countryCode="US">
					<a href="tel:+1234567890">+1 234 567 890</a>
				</TextWithFlag>
			);

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveAttribute( 'href', 'tel:+1234567890' );
			expect( link ).toHaveTextContent( '+1 234 567 890' );
		} );

		it( 'renders multiple children', () => {
			render(
				<TextWithFlag countryCode="US">
					<span>First</span>
					<span>Second</span>
				</TextWithFlag>
			);

			expect( screen.getByText( 'First' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Second' ) ).toBeInTheDocument();
		} );
	} );
} );
