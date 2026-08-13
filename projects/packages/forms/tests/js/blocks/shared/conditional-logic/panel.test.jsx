import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const SUBJECT_FIELDS = [
	{
		clientId: 'c-name',
		id: 'name_1',
		label: 'Name',
		typeLabel: 'Name field',
		typeKey: 'string',
		options: [],
		step: null,
	},
	{
		clientId: 'c-budget',
		id: 'budget_1',
		label: 'Budget',
		typeLabel: 'Number input field',
		typeKey: 'number',
		options: [],
		step: null,
	},
	{
		clientId: 'c-size',
		id: 'size_1',
		label: 'Size',
		typeLabel: 'Dropdown field',
		typeKey: 'choice',
		options: [
			{ value: 'Small', label: 'Small' },
			{ value: 'Large', label: 'Large' },
		],
		step: null,
	},
	{
		clientId: 'c-terms',
		id: 'terms_1',
		label: 'Terms',
		typeLabel: 'Checkbox',
		typeKey: 'boolean',
		options: [],
		step: null,
	},
	// The common case: a field the author never gave an explicit id.
	{
		clientId: 'c-colour',
		id: '',
		label: 'Untitled field',
		typeLabel: 'Text input field',
		typeKey: 'string',
		options: [],
		step: null,
	},
];

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => <div>{ children }</div>,
} ) );

const mockEnsureFieldId = jest.fn( ( field, usedIds = [] ) => {
	if ( field?.id ) {
		return field.id;
	}
	// Mirrors the real hook: slugify the label, de-duplicate against ids already in use.
	const base = ( field?.label || '' ).trim().toLowerCase().replace( /\s+/g, '-' );
	return usedIds.includes( base ) ? `${ base }-2` : base;
} );

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-subject-fields.js',
	() => ( {
		__esModule: true,
		default: () => SUBJECT_FIELDS,
		useEnsureFieldId: () => mockEnsureFieldId,
	} )
);

const { default: ConditionalLogicPanel } = await import(
	'../../../../../src/blocks/shared/conditional-logic/components/panel.jsx'
);

const DEFAULT_ATTRIBUTE = {
	enabled: false,
	action: 'show',
	logicalOperator: 'any',
	groups: [],
};

const withRules = ( rules, extra = {} ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	groups: [ { logicalOperator: 'all', rules } ],
	...extra,
} );

const setup = async ( conditionalLogic = DEFAULT_ATTRIBUTE, { openModal = true } = {} ) => {
	const setAttributes = jest.fn();
	const { container } = render(
		<ConditionalLogicPanel
			clientId="abc"
			attributes={ { conditionalLogic } }
			setAttributes={ setAttributes }
		/>
	);

	// PanelBody renders collapsed (initialOpen={false}), so nothing inside it exists
	// in the DOM until the title is activated.
	await userEvent.click( screen.getByRole( 'button', { name: 'Conditional logic' } ) );

	// The rules are edited in a dialog, so most of this file has to open it first. Tests
	// about what the inspector itself shows pass openModal: false.
	if ( openModal ) {
		await userEvent.click( screen.getByRole( 'button', { name: /(add|edit) conditions/i } ) );
	}

	return { setAttributes, container };
};

const optionValues = select =>
	within( select )
		.getAllByRole( 'option' )
		.map( o => o.value );

describe( 'ConditionalLogicPanel', () => {
	it( 'renders the panel title', async () => {
		await setup( DEFAULT_ATTRIBUTE, { openModal: false } );
		expect( screen.getByText( 'Conditional logic' ) ).toBeInTheDocument();
	} );

	// The inspector keeps a summary so an author can tell what a field does without opening
	// the dialog. That is the only reason it still holds a panel rather than a bare button.
	it( 'summarises the conditions in the inspector', async () => {
		await setup(
			withRules( [
				{ field: 'name_1', operator: 'is', value: 'x' },
				{ field: 'budget_1', operator: 'gte', value: '5' },
			] ),
			{ openModal: false }
		);

		expect( screen.getByText( 'Shown when all 2 conditions match' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Edit conditions' } ) ).toBeInTheDocument();
	} );

	it( 'summarises a hide action and an any match', async () => {
		await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ], { action: 'hide' } ),
			{ openModal: false }
		);

		expect( screen.getByText( 'Hidden when 1 condition matches' ) ).toBeInTheDocument();
	} );

	it( 'invites the author in when there are no conditions yet', async () => {
		await setup( DEFAULT_ATTRIBUTE, { openModal: false } );

		expect(
			screen.getByText( 'Show or hide this field based on the answer to another field.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Add conditions' } ) ).toBeInTheDocument();
	} );

	it( 'does not render the rule builder until the dialog is opened', async () => {
		await setup( DEFAULT_ATTRIBUTE, { openModal: false } );

		expect( screen.queryByLabelText( 'Action' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Add condition' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the Add condition button with no conditions configured', async () => {
		await setup();
		expect( screen.getByRole( 'button', { name: /add condition/i } ) ).toBeInTheDocument();
	} );

	// `enabled` is derived from whether any rule exists, so a field only carries conditional
	// logic once it actually has a condition.
	// The builder opens with a condition waiting rather than an empty pane and an Add button:
	// an author should not have to press anything to start.
	it( 'opens with a condition ready to fill in', async () => {
		const { setAttributes } = await setup();

		expect( screen.getByLabelText( 'Field' ) ).toBeInTheDocument();
		// Waiting, not written: opening the dialog must not mark the post as changed.
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'enables logic once the waiting condition names a field', async () => {
		const { setAttributes } = await setup();

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), 'budget_1' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				enabled: true,
				groups: [
					{
						logicalOperator: 'any',
						rules: [ expect.objectContaining( { type: 'fieldValue', field: 'budget_1' } ) ],
					},
				],
			} ),
		} );
	} );

	it( 'disables logic again when the last condition is removed', async () => {
		const { setAttributes } = await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] )
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Remove condition 1' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				enabled: false,
				// The group goes with its last rule, back to the default empty state rather
				// than a hollow group nothing reads.
				groups: [],
			} ),
		} );
	} );

	// Both selectors sit inside the dialog's sentence, so they are available whether or not a
	// condition exists yet -- unlike the old inspector layout, which hid them until the first
	// rule was added to keep the column short.
	it( 'offers the action and match selectors in the dialog', async () => {
		await setup();
		expect( screen.getByLabelText( 'Action' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'When' ) ).toBeInTheDocument();
	} );

	// The row arrangement itself is CSS; what this can verify is that the selectors are the
	// words of a sentence rather than labelled fields stacked above the rules.
	it( 'reads as a sentence around the selectors', async () => {
		// Queried through `screen`, not the render container: the dialog portals to the end of
		// the document, so it is not a descendant of what render() returns.
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		// The two selectors carry the sentence between them; the clause finishing it sits
		// underneath rather than being interleaved with the controls.
		expect( screen.getByText( 'of the following conditions are met:' ) ).toBeInTheDocument();
	} );

	it( 'phrases the selectors to read on from each other', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		const action = screen.getByLabelText( 'Action' );
		expect( optionValues( action ) ).toEqual( [ 'show', 'hide' ] );
		expect(
			within( action ).getByRole( 'option', { name: 'Show this field' } )
		).toBeInTheDocument();

		const match = screen.getByLabelText( 'When' );
		expect( optionValues( match ) ).toEqual( [ 'any', 'all' ] );
		expect( within( match ).getByRole( 'option', { name: 'if any' } ) ).toBeInTheDocument();
		expect( within( match ).getByRole( 'option', { name: 'if all' } ) ).toBeInTheDocument();
	} );

	it( 'offers the operators belonging to the subject field type', async () => {
		await setup( withRules( [ { field: 'budget_1', operator: 'greater_than', value: '10' } ] ) );

		const operator = screen.getByLabelText( 'Operator' );
		const values = optionValues( operator );

		expect( values ).toEqual( [
			'equals',
			'not_equals',
			'greater_than',
			'less_than',
			'gte',
			'lte',
			'is_empty',
			'is_not_empty',
		] );
	} );

	it( 'offers string operators for a text subject field', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		const operator = screen.getByLabelText( 'Operator' );
		const values = optionValues( operator );

		expect( values ).toEqual( [
			'is',
			'is_not',
			'contains',
			'does_not_contain',
			'is_empty',
			'is_not_empty',
		] );
	} );

	it( 'renders the value as a dropdown of the subject field own options', async () => {
		await setup( withRules( [ { field: 'size_1', operator: 'is', value: 'Small' } ] ) );

		const value = screen.getByLabelText( 'Value' );
		const options = optionValues( value );

		expect( options ).toEqual( [ '', 'Small', 'Large' ] );
	} );

	it( 'renders a number input for a numeric subject field', async () => {
		await setup( withRules( [ { field: 'budget_1', operator: 'greater_than', value: '10' } ] ) );
		expect( screen.getByLabelText( 'Value' ) ).toHaveAttribute( 'type', 'number' );
	} );

	it( 'renders no value input for operators that take no operand', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is_empty' } ] ) );
		expect( screen.queryByLabelText( 'Value' ) ).not.toBeInTheDocument();
	} );

	it( 'renders no value input for a boolean subject field', async () => {
		await setup( withRules( [ { field: 'terms_1', operator: 'is_checked' } ] ) );
		expect( screen.queryByLabelText( 'Value' ) ).not.toBeInTheDocument();
	} );

	it( 'lists every sibling field, including ones with no explicit id', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		const field = screen.getByLabelText( 'Field' );
		const values = optionValues( field );

		expect( values ).toEqual( [
			'',
			'name_1',
			'budget_1',
			'size_1',
			'terms_1',
			'clientId:c-colour',
		] );
	} );

	// An author cannot tell two "Untitled field" entries apart, so the dropdown appends the
	// field's own block title.
	it( 'shows the field type alongside each label', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		const field = screen.getByLabelText( 'Field' );

		expect(
			within( field ).getByRole( 'option', { name: 'Name (Name field)' } )
		).toBeInTheDocument();
		expect(
			within( field ).getByRole( 'option', { name: 'Budget (Number input field)' } )
		).toBeInTheDocument();
		expect(
			within( field ).getByRole( 'option', { name: 'Untitled field (Text input field)' } )
		).toBeInTheDocument();
	} );

	it( 'warns when a rule references a field that no longer exists', async () => {
		await setup( withRules( [ { field: 'deleted_1', operator: 'is', value: 'x' } ] ) );

		// Scoped to the dialog: Notice mirrors its text into an aria-live region that
		// WordPress appends to document.body, so an unscoped query matches twice.
		expect(
			within( screen.getByRole( 'dialog' ) ).getByText( /no longer exists/i )
		).toBeInTheDocument();
	} );

	// A condition naming no subject, or giving no value where one is needed, is skipped by both
	// evaluators. Letting an author stack up rules that quietly do nothing is the trap here.
	it( 'will not add a second condition until the first says something', async () => {
		const { setAttributes } = await setup( withRules( [] ) );
		const addButton = screen.getByRole( 'button', { name: 'Add condition' } );

		// aria-disabled rather than the disabled attribute: the design-system button stays
		// focusable so a keyboard user can reach it and read why it will not act.
		expect( addButton ).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.getByText( 'Finish the condition above before adding another.' )
		).toBeInTheDocument();

		// An aria-disabled button still receives clicks, so the guard has to hold.
		await userEvent.click( addButton );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'allows a second condition once the first is complete', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByRole( 'button', { name: 'Add condition' } ) ).toBeEnabled();
	} );

	it( 'marks a complete condition with a tick', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByLabelText( 'Condition is complete' ) ).toBeInTheDocument();
	} );

	it( 'says why a started condition will be ignored', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: '' } ] ) );

		expect(
			screen.getByText( 'Give this condition a value, or it will be ignored.' )
		).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Condition is complete' ) ).not.toBeInTheDocument();
	} );

	// Regression: fields whose id the renderer derives at output time were filtered out of
	// the dropdown, leaving only the Name field, which ships explicit default ids.
	it( 'assigns an id when a field without one is chosen as the subject', async () => {
		mockEnsureFieldId.mockClear();
		const { setAttributes } = await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] )
		);

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), 'clientId:c-colour' );

		expect( mockEnsureFieldId ).toHaveBeenCalledWith(
			expect.objectContaining( { clientId: 'c-colour', id: '' } ),
			expect.arrayContaining( [ 'name_1', 'budget_1' ] )
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				groups: [
					{
						logicalOperator: 'all',
						rules: [ { field: 'untitled-field', operator: 'is', value: '' } ],
					},
				],
			} ),
		} );
	} );

	it( 'keeps the existing id when the chosen field already has one', async () => {
		const { setAttributes } = await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] )
		);

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), 'budget_1' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				groups: [
					{
						logicalOperator: 'all',
						rules: [ { field: 'budget_1', operator: 'equals', value: '' } ],
					},
				],
			} ),
		} );
	} );

	it( 'removes a condition', async () => {
		const { setAttributes } = await setup(
			withRules( [
				{ field: 'name_1', operator: 'is', value: 'x' },
				{ field: 'budget_1', operator: 'gte', value: '5' },
			] )
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Remove condition 1' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				groups: [
					{
						logicalOperator: 'all',
						rules: [ { field: 'budget_1', operator: 'gte', value: '5' } ],
					},
				],
			} ),
		} );
	} );
} );
