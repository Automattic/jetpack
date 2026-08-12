import { beforeEach, describe, expect, jest, test } from '@jest/globals';

/**
 * Tests for the shared field registry in src/modules/form/view.js — `registerField`,
 * `actions.updateField` and the `getValidator` lookup that routes between a field module's
 * registered validator and the shared `validateField()` helper.
 *
 * This is the highest blast-radius part of the form store: every field type goes through it,
 * and a validator registered by any one module changes how that type is validated everywhere.
 */

// Mock WordPress Interactivity API.
const mockStore = jest.fn();
const mockGetContext = jest.fn();
const mockGetConfig = jest.fn();
const mockGetElement = jest.fn();
const mockWithSyncEvent = jest.fn( callback => callback );

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: mockStore,
	getContext: mockGetContext,
	getConfig: mockGetConfig,
	getElement: mockGetElement,
	withSyncEvent: mockWithSyncEvent,
} ) );

// The field type icons view imports an SVG via `?raw`, which jest has no transform for, and it
// only registers callbacks that are irrelevant here.
await jest.unstable_mockModule(
	'../../../../src/modules/form/field-type-icons-view.js',
	() => ( {} )
);

describe( 'Form field registry', () => {
	let storeConfig;
	let context;

	/**
	 * Build a field-wrapper context. Mirrors what render_field() serializes: the wrapper carries
	 * the field's identity and config, but none of the per-field-type state that descendant
	 * elements provide.
	 *
	 * @param {object} overrides - Context overrides.
	 * @return {object} The context.
	 */
	const makeContext = ( overrides = {} ) => ( {
		fields: {},
		fieldId: 'field-1',
		fieldType: 'text',
		fieldLabel: 'Name',
		fieldValue: '',
		fieldIsRequired: false,
		fieldExtra: null,
		...overrides,
	} );

	const registerCurrentField = () => storeConfig.callbacks.initializeField();
	const field = ( id = 'field-1' ) => context.fields[ id ];

	beforeEach( async () => {
		jest.clearAllMocks();
		jest.resetModules();

		context = makeContext();
		mockGetContext.mockImplementation( () => context );
		mockGetElement.mockReturnValue( { ref: document.createElement( 'div' ) } );
		mockGetConfig.mockReturnValue( { error_types: {} } );

		mockStore.mockImplementation( ( namespace, config ) => {
			storeConfig = config;
			return config;
		} );

		await import( '../../../../src/modules/form/view.js' );
	} );

	describe( 'registerField', () => {
		test( 'registers a field with its identity and config', () => {
			context = makeContext( { fieldValue: 'Ada', fieldExtra: { min: 1 } } );

			registerCurrentField();

			expect( field() ).toMatchObject( {
				id: 'field-1',
				type: 'text',
				label: 'Name',
				value: 'Ada',
				isRequired: false,
				extra: { min: 1 },
			} );
		} );

		test( 'uses the shared helper when no validator is registered for the type', () => {
			context = makeContext( { fieldType: 'email', fieldValue: 'not-an-email' } );

			registerCurrentField();

			expect( field().error ).toBe( 'invalid_email' );
		} );

		test( 'prefers a registered validator over the shared helper', () => {
			const validator = jest.fn( () => 'invalid_custom' );
			storeConfig.state.validators.text = validator;
			context = makeContext( { fieldValue: 'anything', fieldIsRequired: true } );

			registerCurrentField();

			expect( validator ).toHaveBeenCalledWith( 'anything', true, null );
			expect( field().error ).toBe( 'invalid_custom' );
		} );

		test( 'does not re-register a field that already exists', () => {
			registerCurrentField();
			context.fields[ 'field-1' ].value = 'edited';

			registerCurrentField();

			expect( field().value ).toBe( 'edited' );
		} );
	} );

	describe( 'actions.updateField', () => {
		test( 'stores the value and validates it with the shared helper', () => {
			context = makeContext( { fieldType: 'email' } );
			registerCurrentField();

			storeConfig.actions.updateField( 'field-1', 'nope' );

			expect( field().value ).toBe( 'nope' );
			expect( field().error ).toBe( 'invalid_email' );
		} );

		test( 'prefers a registered validator even when showFieldError is not set', () => {
			// This is the behaviour the file field depends on: previously `state.validators` was
			// only consulted on blur, so a registered validator never ran on input.
			const validator = jest.fn( () => 'invalid_custom' );
			storeConfig.state.validators.text = validator;
			registerCurrentField();

			storeConfig.actions.updateField( 'field-1', 'value' );

			expect( validator ).toHaveBeenCalled();
			expect( field().error ).toBe( 'invalid_custom' );
		} );

		test( 'registers the field first when it was never initialised', () => {
			context = makeContext( { fieldType: 'email', fieldValue: '' } );

			storeConfig.actions.updateField( 'field-1', 'ada@example.com' );

			expect( field() ).toBeDefined();
			expect( field().value ).toBe( 'ada@example.com' );
			expect( field().error ).toBe( 'yes' );
		} );

		test( 'records showFieldError so the field can surface its own error', () => {
			registerCurrentField();

			storeConfig.actions.updateField( 'field-1', 'x', true );

			expect( field().showFieldError ).toBe( true );
		} );
	} );

	describe( 'Validator scope contract', () => {
		test( 'a validator reading descendant context still resolves during registration', () => {
			// `registerField` runs from the field wrapper, which does not have the context a
			// descendant provides. A validator must tolerate those keys being undefined rather
			// than throwing and taking the whole init callback down with it.
			storeConfig.state.validators.text = value => {
				const { notProvidedByTheWrapper = '' } = mockGetContext();
				return notProvidedByTheWrapper === '' && ! value ? 'is_required' : 'yes';
			};
			context = makeContext( { fieldIsRequired: true } );

			expect( () => registerCurrentField() ).not.toThrow();
			expect( field().error ).toBe( 'is_required' );
		} );
	} );

	describe( 'File fields have no shared-helper fallback', () => {
		test( 'validateField no longer understands the file type', async () => {
			// Guards the coupling documented on validateField(): file validation lives in the
			// file field module, so the shared helper deliberately has no `file` branch. If this
			// starts returning a file-specific error, the branch came back and the module's
			// validator is now dead code.
			const { validateField } = await import(
				'../../../../src/contact-form/js/validate-helper.js'
			);

			expect( validateField( 'file', [ { error: 'boom', isUploaded: false } ], true ) ).toBe(
				'yes'
			);
		} );
	} );
} );
