import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mock is registered.
const setActive = jest.fn();
const useSeoToolsToggle = jest.fn( () => ( { isToggling: false, setActive } ) );

jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
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

	it( 'calls setActive( true ) when the primary button is clicked', async () => {
		render( <EnableSeoCard /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( true );
	} );

	it( 'disables the button while toggling', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <EnableSeoCard /> );

		expect( screen.getByRole( 'button', { name: 'Enable SEO tools' } ) ).toBeDisabled();
	} );
} );
