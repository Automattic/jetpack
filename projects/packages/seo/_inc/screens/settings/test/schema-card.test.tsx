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

		const error = screen.getByText( 'Enter both latitude and longitude, or leave both blank.' );
		expect( error ).toHaveClass( 'jetpack-seo-settings__schema-pair-error' );
		expect( screen.getByRole( 'textbox', { name: 'Latitude' } ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'textbox', { name: 'Longitude' } ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables saving and marks invalid LocalBusiness text fields', () => {
		mockForm = makeForm( {
			isDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				address: { ...mockForm.localBusiness.address, addressCountry: 'USA' },
				telephone: 'Call me',
				priceRange: 'x'.repeat( 100 ),
			},
		} );
		renderCard();
		expand();

		expect( screen.getByRole( 'textbox', { name: 'Country' } ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( screen.getByRole( 'textbox', { name: 'Phone' } ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( screen.getByRole( 'textbox', { name: 'Price range' } ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( screen.getByText( 'Enter fewer than 100 characters.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'uppercases country codes as they are entered', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expand();

		// eslint-disable-next-line testing-library/prefer-user-event -- single controlled change; see note above.
		fireEvent.change( screen.getByRole( 'textbox', { name: 'Country' } ), {
			target: { value: 'us' },
		} );
		expect( setLocalBusinessField ).toHaveBeenCalledWith( {
			address: { ...mockForm.localBusiness.address, addressCountry: 'US' },
		} );

		// eslint-disable-next-line testing-library/prefer-user-event -- single controlled change; see note above.
		fireEvent.change( screen.getByRole( 'textbox', { name: 'Country' } ), {
			target: { value: 'uſ' },
		} );
		expect( setLocalBusinessField ).toHaveBeenLastCalledWith( {
			address: { ...mockForm.localBusiness.address, addressCountry: 'Uſ' },
		} );
	} );

	it.each( [
		[ { opens: '09:00', closes: '' }, 'Monday closes' ],
		[ { opens: '', closes: '17:00' }, 'Monday opens' ],
	] )( 'disables saving when an opening-hours pair is incomplete', ( monday, missingField ) => {
		mockForm = makeForm( {
			isDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				openingHours: { ...mockForm.localBusiness.openingHours, Mo: monday },
			},
		} );
		renderCard();
		expand();

		expect( screen.getByLabelText( missingField ) ).toHaveAttribute( 'aria-invalid', 'true' );
		const error = screen.getByText( 'Enter both opening and closing times, or leave both blank.' );
		expect( error ).toHaveClass( 'jetpack-seo-settings__schema-pair-error' );
		expect( screen.getByLabelText( 'Monday opens' ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByLabelText( 'Monday closes' ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'allows valid international details and overnight hours', () => {
		mockForm = makeForm( {
			isDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				address: { ...mockForm.localBusiness.address, addressCountry: 'US' },
				telephone: '+1 (555) 123-4567',
				priceRange: '💶'.repeat( 99 ),
				openingHours: {
					...mockForm.localBusiness.openingHours,
					Mo: { opens: '20:45', closes: '06:15' },
				},
			},
		} );
		renderCard();
		expand();

		expect( screen.getByText( /closing time earlier than opening/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /^Save$/ } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'clears a native partial time value on blur', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expand();

		const input = screen.getByLabelText( 'Monday opens' ) as HTMLInputElement;
		input.value = '09:00';
		Object.defineProperty( input, 'validity', {
			configurable: true,
			value: { badInput: true },
		} );
		fireEvent.blur( input );

		expect( input ).toHaveValue( '' );
		expect( setLocalBusinessField ).toHaveBeenCalledWith( {
			openingHours: {
				...mockForm.localBusiness.openingHours,
				Mo: { opens: '', closes: '' },
			},
		} );
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
