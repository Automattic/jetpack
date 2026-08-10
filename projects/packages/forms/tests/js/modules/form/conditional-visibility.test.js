import {
	clearVisibilityMemo,
	isFieldHiddenByLogic,
	resolveFormVisibility,
} from '../../../../src/modules/form/conditional-visibility.js';

const showWhen = ( field, value ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	controls: {
		fieldValue: { rules: [ { field, operator: 'is', value } ] },
	},
} );

/**
 * Build the interactivity context the form block emits.
 *
 * @param {object} options          - Context options.
 * @param {string} options.formHash - The form's hash.
 * @param {object} options.types    - Map of field id to shortcode type.
 * @param {object} options.logic    - Map of field id to conditional-logic config.
 * @param {object} options.values   - Map of field id to current value.
 * @return {object} An interactivity context.
 */
const context = ( { formHash, types, logic, values } ) => ( {
	formHash,
	conditionalLogic: { types, logic },
	fields: Object.fromEntries(
		Object.entries( values ).map( ( [ id, value ] ) => [ id, { value } ] )
	),
} );

describe( 'resolveFormVisibility', () => {
	beforeEach( clearVisibilityMemo );

	it( 'returns null when no field has conditional logic', () => {
		expect(
			resolveFormVisibility( {
				formHash: 'a',
				fields: { one: { value: '' } },
			} )
		).toBeNull();
		expect(
			resolveFormVisibility(
				context( {
					formHash: 'a',
					types: { one: 'text' },
					logic: {},
					values: { one: '' },
				} )
			)
		).toBeNull();
	} );

	it( 'hides a field whose condition is not met', () => {
		const visible = resolveFormVisibility(
			context( {
				formHash: 'a',
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: 'Something else', dependent: '' },
			} )
		);

		expect( visible.dependent ).toBe( false );
		expect( visible.trigger ).toBe( true );
	} );

	it( 'shows it once the condition is met', () => {
		const visible = resolveFormVisibility(
			context( {
				formHash: 'a',
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: 'Other', dependent: '' },
			} )
		);

		expect( visible.dependent ).toBe( true );
	} );

	// Regression: the memo used to be a single module-level slot keyed only on the value
	// signature, so a second form on the page with a matching signature was handed the first
	// form's map and showed or hid the wrong fields. Field ids derive from labels, so two
	// forms sharing a "trigger"/"dependent" pair is entirely ordinary.
	it( "does not leak one form's visibility to another with the same value signature", () => {
		const shared = {
			types: { trigger: 'text', dependent: 'text' },
			values: { trigger: 'Other', dependent: '' },
		};

		const first = resolveFormVisibility(
			context( {
				...shared,
				formHash: 'form-one',
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
			} )
		);

		// Same field ids and identical values, but the opposite rule.
		const second = resolveFormVisibility(
			context( {
				...shared,
				formHash: 'form-two',
				logic: { dependent: showWhen( 'trigger', 'Something else' ) },
			} )
		);

		expect( first.dependent ).toBe( true );
		expect( second.dependent ).toBe( false );
	} );

	it( 'memoizes per form rather than globally', () => {
		const build = ( formHash, triggerValue ) =>
			context( {
				formHash,
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: triggerValue, dependent: '' },
			} );

		const a1 = resolveFormVisibility( build( 'form-one', 'Other' ) );
		const b1 = resolveFormVisibility( build( 'form-two', 'Other' ) );
		const a2 = resolveFormVisibility( build( 'form-one', 'Other' ) );

		// Each form keeps its own cached map, and a repeat call reuses it.
		expect( a2 ).toBe( a1 );
		expect( b1 ).not.toBe( a1 );
	} );

	it( 're-resolves when a value changes', () => {
		const build = triggerValue =>
			context( {
				formHash: 'form-one',
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: triggerValue, dependent: '' },
			} );

		expect( resolveFormVisibility( build( 'Other' ) ).dependent ).toBe( true );
		expect( resolveFormVisibility( build( 'Nope' ) ).dependent ).toBe( false );
	} );

	// The context carries shortcode types, which is what both evaluators take.
	it( 'compares a multiple-choice field by membership, not substring', () => {
		const build = values =>
			context( {
				formHash: 'form-choice',
				types: { colours: 'checkbox-multiple', dependent: 'text' },
				logic: {
					dependent: {
						enabled: true,
						action: 'show',
						logicalOperator: 'all',
						controls: {
							fieldValue: {
								rules: [ { field: 'colours', operator: 'contains', value: 'Blue' } ],
							},
						},
					},
				},
				values,
			} );

		expect(
			resolveFormVisibility( build( { colours: [ 'Blueberry' ], dependent: '' } ) ).dependent
		).toBe( false );

		clearVisibilityMemo();

		expect(
			resolveFormVisibility( build( { colours: [ 'Blue' ], dependent: '' } ) ).dependent
		).toBe( true );
	} );

	it( 'falls back to a shared key when the form has no hash', () => {
		const visible = resolveFormVisibility(
			context( {
				formHash: undefined,
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: 'Other', dependent: '' },
			} )
		);

		expect( visible.dependent ).toBe( true );
	} );

	describe( 'isFieldHiddenByLogic', () => {
		const build = triggerValue =>
			context( {
				formHash: 'form-one',
				types: { trigger: 'text', dependent: 'text' },
				logic: { dependent: showWhen( 'trigger', 'Other' ) },
				values: { trigger: triggerValue, dependent: '' },
			} );

		// The visitor cannot see or fill a hidden field, so client-side validation must not
		// count an error against it — otherwise Submit silently stops working.
		it( 'reports a field hidden by its condition', () => {
			expect( isFieldHiddenByLogic( build( 'Nope' ), 'dependent' ) ).toBe( true );
		} );

		it( 'reports a shown field as not hidden', () => {
			expect( isFieldHiddenByLogic( build( 'Other' ), 'dependent' ) ).toBe( false );
		} );

		it( 'reports an unconditional field as not hidden', () => {
			expect( isFieldHiddenByLogic( build( 'Nope' ), 'trigger' ) ).toBe( false );
		} );

		it( 'reports nothing hidden when the form has no conditional logic', () => {
			const plain = {
				formHash: 'plain',
				fields: { one: { value: '' } },
			};

			expect( isFieldHiddenByLogic( plain, 'one' ) ).toBe( false );
		} );

		it( 'reports an unknown field as not hidden', () => {
			expect( isFieldHiddenByLogic( build( 'Nope' ), 'no-such-field' ) ).toBe( false );
		} );
	} );
} );
