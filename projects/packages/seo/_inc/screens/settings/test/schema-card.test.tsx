import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';

// True-ESM Jest (`--experimental-vm-modules`): stub the data/REST edge with
// `jest.unstable_mockModule`, then import the card dynamically. The card mounts
// the Organization section, which fetches on mount through this hook — mocking it
// keeps the card test off the network while exercising the real section + card UI.
const setOrganizationField = jest.fn();
const save = jest.fn();

// Resettable per test so each can vary the configured state the header badge reflects.
let mockForm: SchemaSettingsForm;

const makeForm = ( overrides: Partial< SchemaSettingsForm > = {} ): SchemaSettingsForm => ( {
	// No stored override; the Site Title / Tagline come through as placeholder defaults.
	organization: { name: '', description: '', sameAs: [], email: '' },
	defaults: { name: 'Acme Co', description: 'We make things' },
	isLoading: false,
	isSaving: false,
	isDirty: false,
	setOrganizationField,
	save,
	...overrides,
} );

jest.unstable_mockModule( '../../../data/use-schema-settings', () => ( {
	useSchemaSettings: () => mockForm,
} ) );

const { default: SchemaCard } = await import( '../schema-card' );

describe( 'SchemaCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockForm = makeForm();
	} );

	it( 'renders the Schema section', () => {
		render( <SchemaCard /> );

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toBeInTheDocument();
	} );

	it( 'is collapsed by default', () => {
		render( <SchemaCard /> );

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it( 'expands when the header is clicked', () => {
		render( <SchemaCard /> );

		const trigger = screen.getByRole( 'button', { name: /Schema/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( trigger );

		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'renders the Organization form with the Site Title as the name placeholder', () => {
		render( <SchemaCard /> );

		// The card is collapsed by default (content hidden from the a11y tree); expand it
		// so the form's controls are queryable.
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Schema/ } ) );

		// With no stored override the field is empty and shows the Site Title as a
		// placeholder, so an empty save keeps tracking the Site Title (no drift).
		const nameField = screen.getByRole( 'textbox', { name: /Organization name/ } );
		expect( nameField ).toHaveValue( '' );
		expect( nameField ).toHaveAttribute( 'placeholder', 'Acme Co' );
		// And the repeatable social-profiles control exposes its "Add profile" action.
		expect( screen.getByRole( 'button', { name: /Add profile/ } ) ).toBeInTheDocument();
	} );

	it( 'adds a social-profile row through the hook', () => {
		render( <SchemaCard /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Schema/ } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Add profile/ } ) );

		expect( setOrganizationField ).toHaveBeenCalledWith( { sameAs: [ '' ] } );
	} );

	it( 'shows the configured-field count in the header', () => {
		render( <SchemaCard /> );

		// Site Title + Tagline come through as defaults → 2 of 4 before any input.
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();
	} );

	it( 'counts a social profile toward the header badge', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [ 'https://x.com/acme' ], email: '' },
		} );
		render( <SchemaCard /> );

		expect( screen.getByText( '3 of 4 set' ) ).toBeInTheDocument();
	} );

	it( 'shows "Not set" when nothing is configured (no site identity either)', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [], email: '' },
			defaults: { name: '', description: '' },
		} );
		render( <SchemaCard /> );

		expect( screen.getByText( 'Not set' ) ).toBeInTheDocument();
	} );
} );
