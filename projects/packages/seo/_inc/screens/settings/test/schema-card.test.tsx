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
const saveOrganizationEntity = jest.fn();

// Resettable per test so each can vary the configured state the card reflects.
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
	saveOrganizationEntity,
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

const expandCard = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Schema/ } ) );

describe( 'SchemaCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockForm = makeForm();
	} );

	it( 'renders one collapsed module, not a card per schema type', () => {
		renderCard();

		// The Breadcrumbs / Organization / Local business controls all live inside a
		// single "Schema" module now, so there is exactly one collapsible header and
		// no sibling cards to expand.
		const headers = screen.getAllByRole( 'button', { expanded: false } );
		expect( headers ).toHaveLength( 1 );
		expect( headers[ 0 ] ).toHaveAccessibleName( expect.stringMatching( /Schema/ ) );
		// The module header is a real heading, matching the other Settings modules.
		expect( screen.getByRole( 'heading', { level: 2, name: /Schema/ } ) ).toBeInTheDocument();
	} );

	it( 'counts the smart defaults as configured — the default state is In progress', () => {
		renderCard();

		const header = screen.getByRole( 'button', { name: /Schema/ } );
		expect( header ).toHaveAttribute( 'aria-expanded', 'false' );
		// Name + description are covered by their Site Title / Tagline defaults (the
		// preferred state), so a site that hasn't added social links reads as In
		// progress — not Not started.
		expect( header ).toHaveTextContent( 'In progress' );
	} );

	it( 'shows Not started only when even the smart defaults are empty', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [], email: '' },
			defaults: { name: '', description: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'Not started' );
	} );

	it( 'shows "Complete" once the Organization has profile links', () => {
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [ 'https://x.com/acme' ], email: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'Complete' );
	} );

	it( 'renders the Breadcrumbs toggle and updates it through the hook', () => {
		renderCard();
		expandCard();

		const toggle = screen.getByRole( 'checkbox', { name: 'Breadcrumbs' } );
		expect( toggle ).toBeChecked();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( toggle );
		expect( commitBreadcrumbList ).toHaveBeenCalledWith( { enabled: false } );
	} );

	it( 'shows the Organization fields and the nested local-business toggle', () => {
		renderCard();
		expandCard();

		const nameField = screen.getByRole( 'textbox', { name: 'Name' } );
		expect( nameField ).toHaveValue( '' );
		expect( nameField ).toHaveAttribute( 'placeholder', 'Acme Co' );
		expect( screen.getByRole( 'checkbox', { name: /local business/ } ) ).toBeInTheDocument();
	} );

	it( 'adds an Organization social-profile row through the hook', () => {
		renderCard();
		expandCard();
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Add profile/ } ) );

		expect( setOrganizationField ).toHaveBeenCalledWith( { sameAs: [ '' ] } );
	} );

	it( 'hides LocalBusiness fields until the toggle is enabled', () => {
		const view = renderCard();
		expandCard();

		expect( screen.queryByRole( 'textbox', { name: /Street address/ } ) ).not.toBeInTheDocument();

		view.unmount();
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandCard();

		expect( screen.getByRole( 'textbox', { name: /Street address/ } ) ).toBeInTheDocument();
		expect( screen.getByText( /Google requires an address/ ) ).toBeInTheDocument();
	} );

	it( 'updates the LocalBusiness toggle through the hook', () => {
		renderCard();
		expandCard();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'checkbox', { name: /local business/ } ) );

		expect( setLocalBusinessField ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'saves the Organization and local business together with one button', () => {
		mockForm = makeForm( {
			isOrganizationDirty: true,
			isLocalBusinessDirty: true,
		} );
		renderCard();
		expandCard();

		// A single Save at the bottom of the module persists both sections together —
		// there is no separate "Save organization" / "Save local business".
		expect( screen.getAllByRole( 'button', { name: 'Save' } ) ).toHaveLength( 1 );

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids lockfile churn.
		fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( saveOrganizationEntity ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the single Save disabled until something is dirty', () => {
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it.each( [
		[ 'the Organization is', { isOrganizationDirty: true } ],
		[ 'the local business is', { isLocalBusinessDirty: true } ],
	] )( 'enables the single Save when %s dirty', ( _label, dirty ) => {
		mockForm = makeForm( dirty );
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'pairs the compact Local business fields without pairing Street address', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandCard();

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
		expandCard();

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
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
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
		expandCard();

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
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'uppercases country codes as they are entered', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandCard();

		// eslint-disable-next-line testing-library/prefer-user-event -- single controlled change; see note above.
		fireEvent.change( screen.getByRole( 'textbox', { name: 'Country' } ), {
			target: { value: 'us' },
		} );
		expect( setLocalBusinessField ).toHaveBeenCalledWith( {
			address: { ...mockForm.localBusiness.address, addressCountry: 'US' },
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
		expandCard();

		expect( screen.getByLabelText( missingField ) ).toHaveAttribute( 'aria-invalid', 'true' );
		const error = screen.getByText( 'Enter both opening and closing times, or leave both blank.' );
		expect( error ).toHaveClass( schemaStyles.pairError );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'clears a native partial time value on blur', () => {
		mockForm = makeForm( {
			localBusiness: { ...mockForm.localBusiness, enabled: true },
		} );
		renderCard();
		expandCard();

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

	it( 'disables the single Save when either the Organization or the local business is invalid', () => {
		// An invalid Organization URL disables the shared Save…
		mockForm = makeForm( {
			isOrganizationDirty: true,
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		const view = renderCard();
		expandCard();
		expect(
			screen.getByText( 'Enter a valid URL that starts with http:// or https://.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		view.unmount();

		// …and so does a local-business error, even when the Organization fields are fine.
		mockForm = makeForm( {
			isLocalBusinessDirty: true,
			localBusiness: {
				...EMPTY_LOCAL_BUSINESS,
				enabled: true,
				geo: { latitude: '40.7128', longitude: '' },
			},
		} );
		renderCard();
		expandCard();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
