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
	// Every class the components under test read. A missing key resolves to
	// `undefined` and silently passes any `toHaveClass` assertion — see #50619.
	default: {
		pairedFields: 'schema-paired-fields',
		pairError: 'schema-pair-error',
		entityGroup: 'schema-entity-group',
		saveError: 'schema-save-error',
		muted: 'schema-muted',
		fieldLabel: 'schema-field-label',
		profileInput: 'schema-profile-input',
		profileError: 'schema-profile-error',
		fieldError: 'schema-field-error',
		openingHoursRow: 'schema-opening-hours-row',
		dayLabel: 'schema-day-label',
		avatar: 'schema-avatar',
	},
} ) );

const { default: schemaStyles } = await import( '../schema-settings/style.module.scss' );
const { default: SchemaCard } = await import( '../schema-card' );

// The hook is mocked, so the bootstrap value is only here to satisfy the prop type.
const bootstrap: SchemaSettings = makeSchemaSettings();

const renderCard = () => render( <SchemaCard initialSettings={ bootstrap } /> );

// The Save button's visible label is "Save" but its accessible name is set
// explicitly, because this tab renders several "Save" buttons. Query by the
// accessible name — a `{ name: 'Save' }` query would no longer match.
const saveName = 'Save schema settings';

// The Organization name field's visible label is the one-word "Name", but its
// accessible name is qualified because the Author profile card on the same tab
// also has a "Name" field.
const orgNameField = 'Organization name';

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
		// Exact name, not a regex: the status lives in `CollapsibleCard.HeaderDescription`
		// so it must be the trigger's *description*, never part of its name. A loose
		// /Schema/ would still pass if "Not started" leaked back into the name.
		expect( headers[ 0 ] ).toHaveAccessibleName( 'Schema' );
		expect( headers[ 0 ] ).toHaveAccessibleDescription( 'In progress' );
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

	it( 'does not count an empty profile row toward completion', () => {
		// "Add profile" seeds an empty row. That is not a configured link — and it
		// can never be persisted, because `cleanOrganization` strips it so the form
		// never becomes dirty. Counting it would leave the header claiming
		// "Complete" for a value that will never reach the server.
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [ '' ], email: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'In progress' );
	} );

	it( 'does not count an invalid or duplicate profile link toward completion', () => {
		// The status must reflect what would be *stored*. `cleanProfileUrls` drops
		// malformed and duplicate rows on save, so counting them would let the header
		// read "Complete" while Save is disabled on that very validation error.
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		const view = renderCard();
		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'In progress' );
		view.unmount();

		// A duplicate collapses to one link, so it still counts — once.
		mockForm = makeForm( {
			organization: {
				name: '',
				description: '',
				sameAs: [ 'https://x.com/acme', 'https://x.com/acme' ],
				email: '',
			},
		} );
		renderCard();
		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'Complete' );
	} );

	it( 'does not count a whitespace-only name or description', () => {
		mockForm = makeForm( {
			organization: { name: '   ', description: '\t', sameAs: [], email: '' },
			defaults: { name: '', description: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'Not started' );
	} );

	it( 'falls back to the site defaults when the override is only whitespace', () => {
		// The backend trims the override and then falls back to site identity, so a
		// stray space must not drop the module below what the Site Title already earns.
		mockForm = makeForm( {
			organization: { name: '   ', description: ' ', sameAs: [], email: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'In progress' );
	} );

	it( 'counts an explicit value, not just its default', () => {
		// The rule is "has a value OR its smart default". Every other status test
		// leaves the overrides empty and varies only the defaults, so without this
		// the explicit-value half of the rule could be deleted and CI stay green.
		mockForm = makeForm( {
			organization: { name: 'Acme Inc', description: 'We do things', sameAs: [], email: '' },
			defaults: { name: '', description: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'In progress' );
	} );

	it( 'ignores the contact email in the completion status', () => {
		// Email is deliberately excluded from the count — pinned so the documented
		// decision can't drift. It is the one field trunk's "N of 4 set" badge counted.
		mockForm = makeForm( {
			organization: { name: '', description: '', sameAs: [], email: 'hi@acme.test' },
			defaults: { name: '', description: '' },
		} );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveTextContent( 'Not started' );
	} );

	it( 'renders the Breadcrumbs toggle on and turns it off through the hook', () => {
		renderCard();
		expandCard();

		const toggle = screen.getByRole( 'checkbox', { name: 'Breadcrumbs' } );
		expect( toggle ).toBeChecked();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( toggle );
		expect( commitBreadcrumbList ).toHaveBeenCalledWith( { enabled: false } );
	} );

	it( 'renders the Breadcrumbs toggle off and turns it on through the hook', () => {
		// The fixture defaults to enabled, so without this the `checked` binding could
		// be hard-coded to `true` and every other card test would still pass.
		mockForm = makeForm( { breadcrumbList: { enabled: false } } );
		renderCard();
		expandCard();

		const toggle = screen.getByRole( 'checkbox', { name: 'Breadcrumbs' } );
		expect( toggle ).not.toBeChecked();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( toggle );
		expect( commitBreadcrumbList ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'shows the Organization fields and the nested local-business toggle', () => {
		renderCard();
		expandCard();

		const nameField = screen.getByRole( 'textbox', { name: orgNameField } );
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
		// `getByRole` throws on more than one match, so this is also the assertion
		// that there is exactly ONE Save in the module.
		const save = screen.getByRole( 'button', { name: saveName } );
		// The accessible name disambiguates it from the tab's other Save buttons, but
		// the visible label must stay the plain "Save" the other modules use.
		expect( save ).toHaveTextContent( 'Save' );

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids lockfile churn.
		fireEvent.click( save );

		expect( saveOrganizationEntity ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the single Save disabled until something is dirty', () => {
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
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

		expect( screen.getByRole( 'button', { name: saveName } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables the Save and the auto-saving toggle while a save is in flight', () => {
		// The `isSaving` arm of the disabled expression, and `disabled={ isSaving }` on
		// the Breadcrumbs toggle. `makeForm` hardcodes `isSaving: false`, so without
		// this both could be deleted and every other card test would still pass.
		mockForm = makeForm( { isSaving: true, isOrganizationDirty: true } );
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'checkbox', { name: 'Breadcrumbs' } ) ).toBeDisabled();
	} );

	it( 'enables the Save when a valid local business and valid profile links are set', () => {
		// The positive path through BOTH validators. Without it, a validator that
		// rejects everything — leaving Save permanently stuck — ships green.
		mockForm = makeForm( {
			isOrganizationDirty: true,
			isLocalBusinessDirty: true,
			organization: {
				name: 'Acme Co',
				description: 'We make things',
				sameAs: [ 'https://twitter.com/acme', 'https://www.linkedin.com/company/acme' ],
				email: 'hi@acme.test',
			},
			localBusiness: {
				...EMPTY_LOCAL_BUSINESS,
				enabled: true,
				address: {
					streetAddress: '123 Main St',
					addressLocality: 'Springfield',
					addressRegion: 'IL',
					postalCode: '62701',
					addressCountry: 'US',
				},
				telephone: '+1 (555) 123-4567',
				priceRange: 'x'.repeat( 99 ),
				geo: { latitude: '40.7128', longitude: '-74.0060' },
				// Overnight hours: closing earlier than opening is legitimate.
				openingHours: {
					...EMPTY_LOCAL_BUSINESS.openingHours,
					Mo: { opens: '20:45', closes: '06:15' },
				},
			},
		} );
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: saveName } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.queryByText( 'Fix the highlighted fields to save.' ) ).not.toBeInTheDocument();
	} );

	it( 'ignores stale local-business errors while the local business is switched off', () => {
		// The `localBusiness.enabled &&` short-circuit. Invalid values behind a
		// switched-off toggle are hidden and normalized server-side, so they must not
		// block saving the Organization.
		mockForm = makeForm( {
			isOrganizationDirty: true,
			localBusiness: {
				...EMPTY_LOCAL_BUSINESS,
				enabled: false,
				geo: { latitude: '40.7128', longitude: '' },
			},
		} );
		renderCard();
		expandCard();

		expect( screen.getByRole( 'button', { name: saveName } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'flags a duplicated profile URL and blocks the Save', () => {
		// Dedupe is a live feature with no coverage anywhere in the suite otherwise —
		// the branch could be deleted and all 33 suites would stay green.
		mockForm = makeForm( {
			isOrganizationDirty: true,
			organization: {
				name: '',
				description: '',
				sameAs: [ 'https://twitter.com/acme', 'https://twitter.com/acme' ],
				email: '',
			},
		} );
		renderCard();
		expandCard();

		expect( screen.getByText( 'This profile URL is already listed.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'tells the reader why the Save is blocked and points the button at the reason', () => {
		// The button is focusable while disabled (@wordpress/ui sets `aria-disabled`,
		// not the native attribute), and the offending field can be off screen.
		mockForm = makeForm( {
			isOrganizationDirty: true,
			organization: { name: '', description: '', sameAs: [ 'not a url' ], email: '' },
		} );
		renderCard();
		expandCard();

		const message = screen.getByText( 'Fix the highlighted fields to save.' );
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
			'aria-describedby',
			message.id
		);
	} );

	it( 'groups the Organization details and local business under a named fieldset', () => {
		// The three cards each carried their own heading; one card would leave these
		// as flat siblings with only a visual rule to convey the grouping.
		renderCard();
		expandCard();

		expect( screen.getByRole( 'group', { name: 'Organization details' } ) ).toContainElement(
			screen.getByRole( 'textbox', { name: orgNameField } )
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
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
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
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
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

		const country = screen.getByRole( 'textbox', { name: 'Country' } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single controlled change; see note above.
		fireEvent.change( country, { target: { value: 'us' } } );
		expect( setLocalBusinessField ).toHaveBeenCalledWith( {
			address: { ...mockForm.localBusiness.address, addressCountry: 'US' },
		} );

		// ASCII-only, which is the whole reason `uppercaseAscii` exists instead of
		// `.toUpperCase()` — the latter folds a long s to "S" and would invent a
		// valid-looking country code out of one that isn't.
		// eslint-disable-next-line testing-library/prefer-user-event -- single controlled change; see note above.
		fireEvent.change( country, { target: { value: 'uſ' } } );
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
		expandCard();

		expect( screen.getByLabelText( missingField ) ).toHaveAttribute( 'aria-invalid', 'true' );
		const error = screen.getByText( 'Enter both opening and closing times, or leave both blank.' );
		expect( error ).toHaveClass( schemaStyles.pairError );
		// Both inputs point at the shared message, so either one announces the reason.
		for ( const field of [ 'Monday opens', 'Monday closes' ] ) {
			expect( screen.getByLabelText( field ) ).toHaveAttribute( 'aria-describedby', error.id );
		}
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
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
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
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
		expect( screen.getByRole( 'button', { name: saveName } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
