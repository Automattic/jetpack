/**
 * Containment tests for conditional-logic container blocks.
 *
 * Mirrors Conditional_Logic_Container_Test::test_apply_containment_* in PHP. The browser
 * decides what the visitor sees and the server decides what is validated and stored, so the
 * two have to agree about which fields a hidden container takes with it — a disagreement
 * either blocks the form on a field nobody was shown, or accepts an answer for one that was
 * hidden.
 */

import {
	clearVisibilityMemo,
	isFieldHiddenByLogic,
	resolveFormVisibility,
} from '../../../../src/modules/form/conditional-visibility.js';

const showWhen = ( field, value ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	groups: [ { logicalOperator: 'all', rules: [ { field, operator: 'is', value } ] } ],
} );

/**
 * Build the interactivity context the form block emits for a form with a container.
 *
 * @param {object} options          - Context options.
 * @param {string} options.formHash - The form's hash.
 * @param {object} options.types    - Map of id to shortcode type.
 * @param {object} options.logic    - Map of id to conditional-logic config.
 * @param {object} options.contains - Map of container id to enclosed field ids.
 * @param {object} options.values   - Map of field id to current value.
 * @return {object} An interactivity context.
 */
const context = ( { formHash, types, logic, contains, values } ) => ( {
	formHash,
	conditionalLogic: { types, logic, contains },
	fields: Object.fromEntries(
		Object.entries( values ).map( ( [ id, value ] ) => [ id, { value } ] )
	),
} );

const oneContainer = ( nameValue, extra = {} ) =>
	context( {
		formHash: 'form-1',
		types: { name: 'name', secret: 'text', outside: 'text', 'jp-container-1': 'container' },
		logic: { 'jp-container-1': showWhen( 'name', 'Bob' ) },
		contains: { 'jp-container-1': [ 'secret' ] },
		values: { name: nameValue, secret: '', outside: '' },
		...extra,
	} );

describe( 'container containment', () => {
	beforeEach( clearVisibilityMemo );

	it( 'hides the container and the field inside it when the condition is unmet', () => {
		const ctx = oneContainer( 'Alice' );
		const visibility = resolveFormVisibility( ctx );

		expect( visibility[ 'jp-container-1' ] ).toBe( false );
		expect( visibility.secret ).toBe( false );
	} );

	it( 'shows both once the condition is met', () => {
		const visibility = resolveFormVisibility( oneContainer( 'Bob' ) );

		expect( visibility[ 'jp-container-1' ] ).toBe( true );
		expect( visibility.secret ).toBe( true );
	} );

	it( 'leaves a field outside the container alone', () => {
		const visibility = resolveFormVisibility( oneContainer( 'Alice' ) );

		expect( visibility.outside ).toBe( true );
	} );

	it( 'reports an enclosed field as hidden to validation', () => {
		// This is the call the submit path makes: a required field the visitor never saw must
		// not count against them.
		expect( isFieldHiddenByLogic( oneContainer( 'Alice' ), 'secret' ) ).toBe( true );
		expect( isFieldHiddenByLogic( oneContainer( 'Bob' ), 'secret' ) ).toBe( false );
	} );

	it( 'does not re-show a field whose own rules hid it', () => {
		// A visible container must not override the conditions on a field inside it.
		const ctx = context( {
			formHash: 'form-2',
			types: { name: 'name', secret: 'text', 'jp-container-1': 'container' },
			logic: {
				'jp-container-1': showWhen( 'name', 'Bob' ),
				secret: showWhen( 'name', 'Carol' ),
			},
			contains: { 'jp-container-1': [ 'secret' ] },
			values: { name: 'Bob', secret: '' },
		} );

		const visibility = resolveFormVisibility( ctx );

		expect( visibility[ 'jp-container-1' ] ).toBe( true );
		expect( visibility.secret ).toBe( false );
	} );

	it( 'hides a field enclosed by either of two nested containers', () => {
		const ctx = context( {
			formHash: 'form-3',
			types: {
				name: 'name',
				secret: 'text',
				'jp-container-1': 'container',
				'jp-container-2': 'container',
			},
			logic: {
				'jp-container-1': showWhen( 'name', 'Bob' ),
				'jp-container-2': showWhen( 'name', 'Carol' ),
			},
			contains: {
				'jp-container-1': [ 'secret' ],
				'jp-container-2': [ 'secret' ],
			},
			values: { name: 'Bob', secret: '' },
		} );

		const visibility = resolveFormVisibility( ctx );

		// The outer container is satisfied, the inner one is not, so the field stays hidden.
		expect( visibility[ 'jp-container-1' ] ).toBe( true );
		expect( visibility[ 'jp-container-2' ] ).toBe( false );
		expect( visibility.secret ).toBe( false );
	} );

	it( 'is a no-op for a form with no containers', () => {
		const ctx = context( {
			formHash: 'form-4',
			types: { name: 'name', secret: 'text' },
			logic: { secret: showWhen( 'name', 'Bob' ) },
			contains: undefined,
			values: { name: 'Bob', secret: '' },
		} );

		expect( resolveFormVisibility( ctx ).secret ).toBe( true );
	} );
} );
