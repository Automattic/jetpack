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
const commitBreadcrumbList = jest.fn();
const setLocalBusinessField = jest.fn();
const saveOrganization = jest.fn();
const saveLocalBusiness = jest.fn();

// Resettable per test so each can vary the configured state the header badge reflects.
let mockForm: SchemaSettingsForm;

const makeForm = ( overrides: Partial< SchemaSettingsForm > = {} ): SchemaSettingsForm => ( {
	// No stored override; the Site Title / Tagline come through as placeholder defaults.
	breadcrumbList: { enabled: true },
	organization: { name: '', description: '', sameAs: [], email: '' },
	defaults: { name: 'Acme Co', description: 'We make things' },
	localBusiness: EMPTY_LOCAL_BUSINESS,
	localBusinessDefaults: EMPTY_LOCAL_BUSINESS_DEFAULTS,
	isSaving: false,
	isOrganizationDirty: false,
	isLocalBusinessDirty: false,
	commitBreadcrumbList,
	setOrganizationField,
	setLocalBusinessField,
	saveOrganization,
	saveLocalBusiness,
	...overrides,
} );

jest.unstable_mockModule( '../../../data/use-schema-settings', () => ( {
	useSchemaSettings: () => mockForm,
} ) );

jest.unstable_mockModule( '../schema-settings/style.module.scss', () => ( {
	default: { pairedFields: 'schema-paired-fields', pairError: 'schema-pair-error' },
} ) );

const { default: schemaStyles } = await import( '../schema-settings/style.module.scss' );
const { default: SchemaCard } = await import( '../schema-card' );

// The hook is mocked, so the bootstrap value is only here to satisfy the prop type.
const bootstrap: SchemaSettings = makeSchemaSettings();

const renderCard = () => render( <SchemaCard initialSettings={ bootstrap } /> );

const expandOrganization = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Organization/ } ) );

const expandLocalBusiness = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
	fireEvent.click( screen.getByRole( 'button', { name: /Local business/ } ) );

const expandBreadcrumbs = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
	fireEvent.click( screen.getByRole( 'button', { name: /Breadcrumbs/ } ) );

describe( 'SchemaCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockForm = makeForm();
	} );

	it( 'renders all three schema sections collapsed by default', () => {
		renderCard();

		for ( const name of [ /Breadcrumbs/, /Organization/, /Local business/ ] ) {
			expect( screen.getByRole( 'button', { name } ) ).toHaveAttribute( 'aria-expanded', 'false' );
		}
	} );

	it( 'renders the Organization form with the Site Title as the name placeholder', () => {
		renderCard();
		expandOrganization();

		// With no stored override the field is empty and shows the Site Title as a
		// placeholder, so an empty save keeps tracking the Site Title (no drift).
		const nameField = screen.getByRole( 'textbox', { name: /Organization name/ } );
		expect( nameField ).toHaveValue( '' );
		expect( nameField ).toHaveAttribute( 'placeholder', 'Acme Co' );
		expect( screen.getByRole( 'button', { name: /Add profile/ } ) ).toBeInTheDocument();
	} );

	it( 'renders the enabled Breadcrumbs card and updates its toggle', () => {
		renderCard();
		expandBreadcrumbs();

		const toggle = screen.getByRole( 'checkbox', { name: 'Enable breadcrumb schema' } );
		expect( toggle ).toBeChecked();
		expect( screen.getByText( 'Enabled' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'textbox', { name: /Organization name/ } )
		).not.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( toggle );
		expect( commitBreadcrumbList ).toHaveBeenCalledWith( { enabled: false } );
	} );

	it( 'renders an explicitly disabled Breadcrumbs card without changing the Organization badge', () => {
		mockForm = makeForm( { breadcrumbList: { enabled: false } } );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Breadcrumbs/ } ) ).toHaveTextContent( 'Disabled' );
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();
		expandBreadcrumbs();
		expect(
			screen.getByRole( 'checkbox', { name: 'Enable breadcrumb schema' } )
		).not.toBeChecked();
	} );

	it( 'adds a social-profile row through the hook', () => {
		renderCard();
		expandOrganization();
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Add profile/ } ) );

		expect( setOrganizationField ).toHaveBeenCalledWith( { sameAs: [ '' ] } );
	} );

	it( 'hides LocalBusiness fields until the toggle is enabled', () => {
		const view = renderCard();
		expandLocalBusiness();

		expect( screen.queryByRole( 'textbox', { name: /Street address/ } ) ).not.toBeInTheDocument();

		view.unmount();
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandLocalBusiness();

		expect( screen.getByRole( 'textbox', { name: /Street address/ } ) ).toBeInTheDocument();
		expect( screen.getByText( /Google requires an address/ ) ).toBeInTheDocument();
	} );

	it( 'updates the LocalBusiness toggle through the hook', () => {
		renderCard();
		expandLocalBusiness();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'checkbox', { name: /local business/ } ) );

		expect( setLocalBusinessField ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'saves Organization and Local business independently', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
			isLocalBusinessDirty: true,
		} );
		renderCard();
		expandOrganization();
		expandLocalBusiness();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids lockfile churn.
		fireEvent.click( screen.getByRole( 'button', { name: 'Save organization' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: 'Save local business' } ) );

		expect( saveOrganization ).toHaveBeenCalledTimes( 1 );
		expect( saveLocalBusiness ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'pairs the compact Local business fields without pairing Street address', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandLocalBusiness();

		const expectPair = ( first: HTMLElement, second: HTMLElement ) => {
			// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the layout contract under test.
			const pair = first.closest( `.${ schemaStyles.pairedFields }` );
			expect( pair ).not.toBeNull();
			expect( pair ).toContainElement( second );
		};
		const streetAddress = screen.getByRole( 'textbox', { name: 'Street address' } );
		// eslint-disable-next-line testing-library/no-node-access -- the absence of a paired wrapper is the layout contract.
		expect( streetAddress.closest( `.${ schemaStyles.pairedFields }` ) ).toBeNull();
		expectPair(
			screen.getByRole( 'textbox', { name: 'City' } ),
			screen.getByRole( 'textbox', { name: 'State/Region' } )
		);
		expectPair(
			screen.getByRole( 'textbox', { name: 'Postal code' } ),
			screen.getByRole( 'textbox', { name: 'Country' } )
		);
		expectPair(
			screen.getByRole( 'textbox', { name: 'Phone' } ),
			screen.getByRole( 'textbox', { name: 'Price range' } )
		);
		expectPair(
			screen.getByRole( 'textbox', { name: 'Latitude' } ),
			screen.getByRole( 'textbox', { name: 'Longitude' } )
		);
		expectPair( screen.getByLabelText( 'Monday opens' ), screen.getByLabelText( 'Monday closes' ) );
	} );

	it( 'disables saving when only one geo coordinate is filled', () => {
		mockForm = makeForm( {
			isLocalBusinessDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				geo: { latitude: '40.7128', longitude: '' },
			},
		} );
		renderCard();
		expandLocalBusiness();

		const error = screen.getByText( 'Enter both latitude and longitude, or leave both blank.' );
		expect( error ).toHaveClass( schemaStyles.pairError );
		expect( screen.getByRole( 'textbox', { name: 'Latitude' } ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'textbox', { name: 'Longitude' } ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables saving and marks invalid LocalBusiness text fields', () => {
		mockForm = makeForm( {
			isLocalBusinessDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				address: { ...mockForm.localBusiness.address, addressCountry: 'USA' },
				telephone: 'Call me',
				priceRange: 'x'.repeat( 100 ),
			},
		} );
		renderCard();
		expandLocalBusiness();

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
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'uppercases country codes as they are entered', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandLocalBusiness();

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
			isLocalBusinessDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				openingHours: { ...mockForm.localBusiness.openingHours, Mo: monday },
			},
		} );
		renderCard();
		expandLocalBusiness();

		expect( screen.getByLabelText( missingField ) ).toHaveAttribute( 'aria-invalid', 'true' );
		const error = screen.getByText( 'Enter both opening and closing times, or leave both blank.' );
		expect( error ).toHaveClass( schemaStyles.pairError );
		expect( screen.getByLabelText( 'Monday opens' ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByLabelText( 'Monday closes' ) ).toHaveAttribute(
			'aria-describedby',
			error.id
		);
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'allows valid international details and overnight hours', () => {
		mockForm = makeForm( {
			isLocalBusinessDirty: true,
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
		expandLocalBusiness();

		expect( screen.getByText( /closing time earlier than opening/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'clears a native partial time value on blur', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandLocalBusiness();

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
			isOrganizationDirty: true,
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		renderCard();
		expandOrganization();

		expect(
			screen.getByText( 'Enter a valid URL that starts with http:// or https://.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save organization' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'keeps Local business saving enabled when Organization URLs are invalid', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
			isLocalBusinessDirty: true,
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		renderCard();
		expandOrganization();
		expandLocalBusiness();

		expect( screen.getByRole( 'button', { name: 'Save organization' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'keeps Organization saving enabled when Local business values are invalid', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
			isLocalBusinessDirty: true,
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
				geo: { latitude: '40.7128', longitude: '' },
			},
		} );
		renderCard();
		expandOrganization();
		expandLocalBusiness();

		expect( screen.getByRole( 'button', { name: 'Save organization' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Save local business' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'allows full social profile URLs', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
			organization: {
				name: '',
				description: '',
				sameAs: [ 'https://bsky.app/profile/acme.example' ],
				email: '',
			},
		} );
		renderCard();
		expandOrganization();

		expect(
			screen.queryByText( 'Enter a valid URL that starts with http:// or https://.' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save organization' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables saving when social profile URLs are duplicated', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
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
		expandOrganization();

		expect( screen.getAllByText( 'This profile URL is already listed.' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'button', { name: 'Save organization' } ) ).toHaveAttribute(
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

	it( 'shows Local business status without changing the four-field Organization count', () => {
		const view = renderCard();
		expect( screen.getByRole( 'button', { name: /Local business/ } ) ).toHaveTextContent(
			'Disabled'
		);
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();

		view.unmount();
		mockForm = makeForm( {
			localBusiness: {
				...mockForm.localBusiness,
				enabled: true,
			},
		} );
		renderCard();
		expect( screen.getByRole( 'button', { name: /Local business/ } ) ).toHaveTextContent(
			'Enabled'
		);
		expect( screen.getByText( '2 of 4 set' ) ).toBeInTheDocument();
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
