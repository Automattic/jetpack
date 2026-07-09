import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import {
	EMPTY_LOCAL_BUSINESS,
	EMPTY_LOCAL_BUSINESS_DEFAULTS,
	makeSchemaSettings,
} from '../../../data/test/fixtures/schema-settings-fixtures';
import type { SchemaSettings } from '../../../data/schema-settings-types';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';

// True-ESM Jest (`--experimental-vm-modules`): stub the data/REST edge with
// `jest.unstable_mockModule`, then import the card dynamically. Mocking the hook
// keeps the card test off the network while exercising the real section + card UI.
const setOrganizationField = jest.fn();
const setLocalBusinessField = jest.fn();
const save = jest.fn();

// Resettable per test so each can vary the configured state the header badge reflects.
let mockForm: SchemaSettingsForm;

const makeForm = ( overrides: Partial< SchemaSettingsForm > = {} ): SchemaSettingsForm => ( {
	// No stored override; the Site Title / Tagline come through as placeholder defaults.
	organization: { name: '', description: '', sameAs: [], email: '' },
	defaults: { name: 'Acme Co', description: 'We make things' },
	localBusiness: EMPTY_LOCAL_BUSINESS,
	localBusinessDefaults: EMPTY_LOCAL_BUSINESS_DEFAULTS,
	isSaving: false,
	isDirty: false,
	setOrganizationField,
	setLocalBusinessField,
	save,
	...overrides,
} );

jest.unstable_mockModule( '../../../data/use-schema-settings', () => ( {
	useSchemaSettings: () => mockForm,
} ) );

const { default: SchemaCard } = await import( '../schema-card' );

// The hook is mocked, so the bootstrap value is only here to satisfy the prop type.
const bootstrap: SchemaSettings = makeSchemaSettings();

const renderCard = () => render( <SchemaCard initialSettings={ bootstrap } /> );

const expand = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Schema/ } ) );

describe( 'SchemaCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockForm = makeForm();
	} );

	it( 'renders the Schema section collapsed by default', () => {
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it( 'renders the Organization form with the Site Title as the name placeholder', () => {
		renderCard();
		expand();

		// With no stored override the field is empty and shows the Site Title as a
		// placeholder, so an empty save keeps tracking the Site Title (no drift).
		const nameField = screen.getByRole( 'textbox', { name: /Organization name/ } );
		expect( nameField ).toHaveValue( '' );
		expect( nameField ).toHaveAttribute( 'placeholder', 'Acme Co' );
		expect( screen.getByRole( 'button', { name: /Add profile/ } ) ).toBeInTheDocument();
	} );

	it( 'adds a social-profile row through the hook', () => {
		renderCard();
		expand();
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Add profile/ } ) );

		expect( setOrganizationField ).toHaveBeenCalledWith( { sameAs: [ '' ] } );
	} );

	it( 'hides LocalBusiness fields until the toggle is enabled', () => {
		const view = renderCard();
		expand();

		expect( screen.queryByRole( 'textbox', { name: /Street address/ } ) ).not.toBeInTheDocument();

		view.unmount();
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expand();

		expect( screen.getByRole( 'textbox', { name: /Street address/ } ) ).toBeInTheDocument();
		expect( screen.getByText( /Google requires it/ ) ).toBeInTheDocument();
	} );

	it( 'updates the LocalBusiness toggle through the hook', () => {
		renderCard();
		expand();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'checkbox', { name: /local business/ } ) );

		expect( setLocalBusinessField ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'disables saving when only one geo coordinate is filled', () => {
		mockForm = makeForm( {
			isDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				geo: { latitude: '40.7128', longitude: '' },
			},
		} );
		renderCard();
		expand();

		expect(
			screen.getAllByText( 'Enter both latitude and longitude, or leave both blank.' )
		).toHaveLength( 2 );
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables saving when a social profile URL is invalid', () => {
		mockForm = makeForm( {
			isDirty: true,
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		renderCard();
		expand();

		expect(
			screen.getByText( 'Enter a valid URL that starts with http:// or https://.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'allows full social profile URLs', () => {
		mockForm = makeForm( {
			isDirty: true,
			organization: {
				name: '',
				description: '',
				sameAs: [ 'https://bsky.app/profile/acme.example' ],
				email: '',
			},
		} );
		renderCard();
		expand();

		expect(
			screen.queryByText( 'Enter a valid URL that starts with http:// or https://.' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables saving when social profile URLs are duplicated', () => {
		mockForm = makeForm( {
			isDirty: true,
			organization: {
				name: '',
				description: '',
				sameAs: [
					'https://bsky.app/profile/acme.example',
					' https://bsky.app/profile/acme.example ',
				],
				email: '',
			},
		} );
		renderCard();
		expand();

		expect( screen.getAllByText( 'This profile URL is already listed.' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'shows the configured-field count in the header', () => {
		renderCard();

		// Site Title + Tagline come through as defaults → 2 of 4 before any input.
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();
	} );

	it( 'counts a social profile toward the header badge', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [ 'https://x.com/acme' ], email: '' },
		} );
		renderCard();

		expect( screen.getByText( '3 of 4 set' ) ).toBeInTheDocument();
	} );

	it( 'counts LocalBusiness address as a fifth badge item only when enabled', () => {
		mockForm = makeForm( {
			localBusiness: {
				...mockForm.localBusiness,
				address: { ...mockForm.localBusiness.address, streetAddress: '123 Main St' },
			},
		} );
		const view = renderCard();
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();

		view.unmount();
		mockForm = makeForm( {
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				address: { ...mockForm.localBusiness.address, streetAddress: '123 Main St' },
			},
		} );
		renderCard();
		expect( screen.getByText( '3 of 5 set' ) ).toBeInTheDocument();
	} );

	it( 'shows "Not set" when nothing is configured (no site identity either)', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [], email: '' },
			defaults: { name: '', description: '' },
		} );
		renderCard();

		expect( screen.getByText( 'Not set' ) ).toBeInTheDocument();
	} );
} );
