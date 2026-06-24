import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mock is registered.
const setActive = jest.fn();
const useSeoToolsToggle = jest.fn( () => ( { isToggling: false, setActive } ) );

jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: useSeoToolsToggle,
} ) );

const { default: DisableSeoTools } = await import( '../disable-seo-tools' );

describe( 'DisableSeoTools', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSeoToolsToggle.mockReturnValue( { isToggling: false, setActive } );
	} );

	it( 'renders the off-ramp', () => {
		render( <DisableSeoTools /> );

		expect( screen.getByText( 'Using a different SEO solution?' ) ).toBeInTheDocument();
	} );

	it( 'calls setActive( false ) when the disable link is clicked', () => {
		render( <DisableSeoTools /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Disable Jetpack SEO tools' } ) );

		expect( setActive ).toHaveBeenCalledWith( false );
	} );

	it( 'disables the button while toggling', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <DisableSeoTools /> );

		expect( screen.getByRole( 'button', { name: 'Disable Jetpack SEO tools' } ) ).toBeDisabled();
	} );
} );
