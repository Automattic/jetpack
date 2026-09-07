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
		render( <EnableSeoCard /> );

		// "Enable SEO tools" is both the card title and the button label.
		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toBeInTheDocument();
		expect( screen.getByText( /SEO tools help your content get found/ ) ).toBeInTheDocument();
	} );

	it( 'calls setActive( true ) when the primary button is clicked', () => {
		render( <EnableSeoCard /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( true );
	} );

	it( 'disables the button while toggling', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <EnableSeoCard /> );

		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
