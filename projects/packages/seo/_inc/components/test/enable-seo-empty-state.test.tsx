import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mock is registered.
const setActive = jest.fn();
const useSeoToolsToggle = jest.fn( () => ( { isToggling: false, setActive } ) );

jest.unstable_mockModule( '../../data/use-seo-tools-toggle', () => ( {
	default: useSeoToolsToggle,
} ) );

const { default: EnableSeoEmptyState } = await import( '../enable-seo-empty-state' );

describe( 'EnableSeoEmptyState', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSeoToolsToggle.mockReturnValue( { isToggling: false, setActive } );
	} );

	it( 'renders the heading, the explanation and the enable button', () => {
		render( <EnableSeoEmptyState screen="overview" /> );

		// "Enable SEO tools" is both the heading and the button label.
		expect( screen.getByRole( 'heading', { name: 'Enable SEO tools' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'SEO tools help your content get found: customize titles and meta descriptions, generate a sitemap, verify your site with search engines, and control how pages look when shared. Turn it on to manage all of it from here.'
			)
		).toBeInTheDocument();
	} );

	it( 'calls setActive( true ) when the primary button is clicked', () => {
		render( <EnableSeoEmptyState screen="overview" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( true );
	} );

	it( 'reports the screen it was rendered on, not always the Overview', () => {
		render( <EnableSeoEmptyState screen="geo" /> );

		expect( useSeoToolsToggle ).toHaveBeenCalledWith( 'geo' );
	} );

	it( 'disables the button while toggling', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <EnableSeoEmptyState screen="overview" /> );

		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
