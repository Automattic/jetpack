import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockStore = jest.fn();
const mockGetContext = jest.fn();
const mockGetConfig = jest.fn();

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: mockStore,
	getContext: mockGetContext,
	getConfig: mockGetConfig,
	getElement: jest.fn(),
	withSyncEvent: callback => callback,
	withScope: callback => callback,
} ) );

const ERROR_TYPES = {
	is_required: 'This field is required.',
};

const showWhen = ( field, value ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	groups: [ { logicalOperator: 'all', rules: [ { field, operator: 'is', value } ] } ],
} );

/**
 * Build a form field as it sits in the `jetpack/form` context.
 *
 * @param {string} id        - Field id.
 * @param {string} label     - Field label.
 * @param {object} overrides - Properties to override.
 * @return {object} The field.
 */
const field = ( id, label, overrides = {} ) => ( {
	id,
	label,
	type: 'text',
	value: '',
	error: 'is_required',
	...overrides,
} );

/**
 * Build a form context from a list of fields.
 *
 * @param {Array}  fields - Fields in the form.
 * @param {object} extra  - Extra context properties.
 * @return {object} The context.
 */
const formContext = ( fields, extra = {} ) => ( {
	formHash: 'test-form',
	showErrors: true,
	fields: Object.fromEntries( fields.map( f => [ f.id, f ] ) ),
	...extra,
} );

describe( 'Form View - error summary list', () => {
	let state;

	beforeEach( async () => {
		jest.resetModules();
		mockStore.mockReset();
		mockGetContext.mockReset();
		mockGetConfig.mockReset();

		mockGetConfig.mockReturnValue( { error_types: ERROR_TYPES } );

		const stores = [];
		mockStore.mockImplementation( ( namespace, definition = {} ) => {
			stores.push( { namespace, definition } );
			return {
				state: definition.state ?? {},
				actions: definition.actions ?? {},
				callbacks: definition.callbacks ?? {},
			};
		} );

		await import( '../../../../src/modules/form/view.js' );

		state = stores.find(
			( { namespace, definition } ) =>
				namespace === 'jetpack/form' && definition.state && 'getErrorList' in definition.state
		).definition.state;
	} );

	const errorIds = () => state.getErrorList.map( error => error.id );

	test( 'lists every required field when the whole form is empty', () => {
		mockGetContext.mockReturnValue(
			formContext( [
				field( 'g1-name', 'Name' ),
				field( 'g1-email', 'Email' ),
				field( 'g1-message', 'Message' ),
			] )
		);

		expect( state.isFormEmpty ).toBe( true );
		expect( state.getErrorList ).toEqual( [
			{ anchor: '#g1-name', label: 'Name: This field is required.', id: 'g1-name' },
			{ anchor: '#g1-email', label: 'Email: This field is required.', id: 'g1-email' },
			{ anchor: '#g1-message', label: 'Message: This field is required.', id: 'g1-message' },
		] );
	} );

	test( 'lists only the remaining invalid fields when the form is partly filled', () => {
		mockGetContext.mockReturnValue(
			formContext( [
				field( 'g1-name', 'Name', { value: 'Roo', error: 'yes' } ),
				field( 'g1-email', 'Email' ),
				field( 'g1-message', 'Message' ),
			] )
		);

		expect( errorIds() ).toEqual( [ 'g1-email', 'g1-message' ] );
	} );

	test( 'stays empty before the visitor tries to submit', () => {
		mockGetContext.mockReturnValue(
			formContext( [ field( 'g1-name', 'Name' ), field( 'g1-email', 'Email' ) ], {
				showErrors: false,
			} )
		);

		expect( state.getErrorList ).toEqual( [] );
	} );

	test( 'skips required fields hidden by conditional logic on an empty form', () => {
		mockGetContext.mockReturnValue(
			formContext(
				[ field( 'g1-choice', 'Choice', { type: 'radio' } ), field( 'g1-details', 'Details' ) ],
				{
					conditionalLogic: {
						types: { 'g1-choice': 'radio', 'g1-details': 'text' },
						logic: { 'g1-details': showWhen( 'g1-choice', 'yes' ) },
					},
				}
			)
		);

		expect( errorIds() ).toEqual( [ 'g1-choice' ] );
	} );

	test( 'lists only the current step of an empty multistep form', () => {
		mockGetContext.mockReturnValue(
			formContext(
				[
					field( 'g1-name', 'Name', { step: 1 } ),
					field( 'g1-email', 'Email', { step: 1 } ),
					field( 'g1-message', 'Message', { step: 2 } ),
				],
				{ isMultiStep: true, maxSteps: 2, currentStep: 1 }
			)
		);

		expect( errorIds() ).toEqual( [ 'g1-name', 'g1-email' ] );
	} );
} );
