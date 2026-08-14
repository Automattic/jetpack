import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';

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
	BlockControls: ( { children } ) => <div>{ children }</div>,
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

/**
 * Render the panel with state, so an edit comes back as props the way the editor does.
 *
 * @param {object} initial - The starting conditionalLogic attribute.
 */
const setupStateful = async initial => {
	const Harness = () => {
		const [ attributes, setAttributes ] = useState( { conditionalLogic: initial } );
		const apply = useCallback(
			next => setAttributes( current => ( { ...current, ...next } ) ),
			[]
		);

		return (
			<ConditionalLogicPanel clientId="abc" attributes={ attributes } setAttributes={ apply } />
		);
	};

	render( <Harness /> );
	await userEvent.click( screen.getByRole( 'button', { name: 'Conditional logic' } ) );
	await userEvent.click( screen.getByRole( 'button', { name: /(add|edit) conditions/i } ) );
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

	// The toolbar button reports the same thing the inspector summary does, for an author who
	// is looking at the canvas rather than the sidebar.
	it( 'adds a toolbar button once the field has conditions', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		expect(
			screen.getByRole( 'button', { name: 'Shown when 1 condition matches' } )
		).toBeInTheDocument();
	} );

	// The same treatment Required uses: inverted while the field carries conditions.
	it( 'inverts the toolbar button while conditions exist', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		expect( screen.getByRole( 'button', { name: 'Shown when 1 condition matches' } ) ).toHaveClass(
			'is-pressed'
		);
	} );

	// Present on every block that supports conditional logic, the way Required is: a control
	// that comes and goes is harder to find than one that is always there.
	it( 'offers the toolbar button before any condition exists', async () => {
		await setup( DEFAULT_ATTRIBUTE, { openModal: false } );

		const button = screen.getByRole( 'button', { name: 'Add conditional logic' } );

		expect( button ).toBeInTheDocument();
		expect( button ).not.toHaveClass( 'is-pressed' );
	} );

	it( 'opens the builder from the toolbar before any condition exists', async () => {
		await setup( DEFAULT_ATTRIBUTE, { openModal: false } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Add conditional logic' } ) );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'opens the dialog from the toolbar button', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Shown when 1 condition matches' } )
		);

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
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

	// The builder opens with a waiting row, and that row is unfinished, so there is nothing
	// to add yet -- the button is absent rather than present and dead.
	// Always offered: withholding it stopped an author adding a second condition while the
	// first was still being written, which is a normal way to work.
	it( 'offers Add condition even while a row is unfinished', async () => {
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
	// A condition naming no subject, or giving no value where one is needed, is skipped by both
	// evaluators. Letting an author stack up rules that quietly do nothing is the trap here.
	// A condition naming no subject, or giving no value where one is needed, is skipped by
	// both evaluators. The badge makes that visible rather than the field silently not
	// reacting, which is why the Add button no longer has to police it.
	it( 'marks an unfinished condition inactive and says what to do', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: '' } ] ) );

		expect( screen.getByText( 'Inactive' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Active' ) ).not.toBeInTheDocument();
		// Queried by label, not text: a tooltip renders nothing until hovered, so the reason
		// has to be on the badge itself to be reachable at all.
		expect( screen.getByLabelText( 'Give this condition a value.' ) ).toBeInTheDocument();
	} );

	it( 'clears every condition at once', async () => {
		const { setAttributes } = await setup(
			withRules( [
				{ field: 'name_1', operator: 'is', value: 'x' },
				{ field: 'budget_1', operator: 'gte', value: '5' },
			] )
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear all conditions' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( { enabled: false, groups: [] } ),
		} );
	} );

	// Clearing is deliberate. Offering another empty row straight away would look like the
	// clear had not worked.
	it( 'does not offer a waiting row after clearing', async () => {
		await setupStateful( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear all conditions' } ) );

		expect( screen.queryByLabelText( 'Field' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Clear all conditions' } )
		).not.toBeInTheDocument();
	} );

	it( 'brings a row back when Add condition is pressed after clearing', async () => {
		await setupStateful( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear all conditions' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Add condition' } ) );

		expect( screen.getByLabelText( 'Field' ) ).toBeInTheDocument();
	} );

	// A new condition appears empty, so the first thing to do with it is choose a subject.
	// This also tells a screen-reader user the row exists at all.
	it( 'moves focus to the new condition after adding one', async () => {
		// Rendered with real state rather than a jest.fn(): adding a condition only shows up
		// if the new attribute comes back as props, which a mock setter never does.
		await setupStateful( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		await userEvent.click( screen.getByRole( 'button', { name: 'Add condition' } ) );

		const fieldSelects = screen.getAllByLabelText( 'Field' );
		expect( fieldSelects ).toHaveLength( 2 );
		expect( fieldSelects[ 1 ] ).toHaveFocus();
	} );

	it( 'does not steal focus when the dialog first opens', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByLabelText( 'Field' ) ).not.toHaveFocus();
	} );

	it( 'allows a second condition once the first is complete', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByRole( 'button', { name: 'Add condition' } ) ).toBeEnabled();
	} );

	it( 'marks a complete condition active', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByText( 'Active' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Inactive' ) ).not.toBeInTheDocument();
	} );

	it( 'explains an inactive condition whose field was deleted', async () => {
		await setup( withRules( [ { field: 'deleted_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByText( 'Inactive' ) ).toBeInTheDocument();
		expect(
			screen.getByLabelText( 'The field this condition refers to no longer exists.' )
		).toBeInTheDocument();
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
