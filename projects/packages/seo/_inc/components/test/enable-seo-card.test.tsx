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

const { default: EnableSeoCard } = await import( '../enable-seo-card' );

describe( 'EnableSeoCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSeoToolsToggle.mockReturnValue( { isToggling: false, setActive } );
	} );

	it( 'renders the enable card', () => {
		render( <EnableSeoCard screen="overview" /> );

		// "Enable SEO tools" is both the card title and the button label.
		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toBeInTheDocument();
		expect( screen.getByText( /SEO tools help your content get found/ ) ).toBeInTheDocument();
	} );

	it( 'calls setActive( true ) when the primary button is clicked', () => {
		render( <EnableSeoCard screen="overview" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( true );
	} );

	it( 'reports the screen it was rendered on, not always the Overview', () => {
		// The card renders on every tab's module-off stage, so a hardcoded
		// `overview` would misattribute enables from the other tabs.
		render( <EnableSeoCard screen="geo" /> );

		expect( useSeoToolsToggle ).toHaveBeenCalledWith( 'geo' );
	} );

	it( 'disables the button while toggling', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <EnableSeoCard screen="overview" /> );

		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
