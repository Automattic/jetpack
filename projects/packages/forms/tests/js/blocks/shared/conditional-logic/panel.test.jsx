import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

// Swapped per test by the duplicate-id cases; reset to SUBJECT_FIELDS before each.
let subjectFields = SUBJECT_FIELDS;

const mockToggleBlockHighlight = jest.fn();
const mockUpdateBlockAttributes = jest.fn();

// InspectorControls is a slot fill, and a fill renders its children only while a matching
// slot is mounted -- which, for the block inspector, means only while the settings sidebar is
// open. A mock that passes children straight through erases that, and with it any test's
// ability to tell "renders in the sidebar" apart from "renders at all". Modelling the slot
// keeps the two distinguishable; `isSidebarOpen` is reset to true before each test, so the
// cases that do not care about the sidebar read exactly as they did before.
let isSidebarOpen = true;

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => ( isSidebarOpen ? <div>{ children }</div> : null ),
	BlockControls: ( { children } ) => <div>{ children }</div>,
	store: 'core/block-editor',
} ) );

// Only useDispatch is replaced. Something in the panel's import graph pulls the real store
// helpers from this module, so a mock that omits them fails at import rather than in a test --
// and one that imports the module from inside its own factory recurses until V8 gives up.
// Loading it first, then registering the mock, avoids both.
const actualData = await import( '@wordpress/data' );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useDispatch: () => ( {
		toggleBlockHighlight: mockToggleBlockHighlight,
		updateBlockAttributes: mockUpdateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent: () => {},
	} ),
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
		default: () => subjectFields,
		useEnsureFieldId: () => mockEnsureFieldId,
	} )
);

// The panel reads two lists: the subject dropdown's fields (which exclude this block) and
// every field id in the form (which includes it), the second being what tells it whether an
// id is unique.
let formFieldIds = [];

const mockFixDuplicateFieldId = jest.fn();

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/hooks/use-fix-duplicate-field-id.js',
	() => ( { __esModule: true, default: () => mockFixDuplicateFieldId } )
);

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/hooks/use-form-field-ids.js',
	() => ( {
		__esModule: true,
		getFormFieldEntries: () => [],
		default: () => formFieldIds,
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

const setup = async (
	conditionalLogic = DEFAULT_ATTRIBUTE,
	{ openModal = true, ownFieldId, sidebarOpen = true } = {}
) => {
	isSidebarOpen = sidebarOpen;

	const setAttributes = jest.fn();
	const { container } = render(
		<ConditionalLogicPanel
			clientId="abc"
			attributes={ { conditionalLogic, id: ownFieldId } }
			setAttributes={ setAttributes }
		/>
	);

	// With the sidebar closed the inspector fill renders nothing, so there is no panel to
	// expand and no button to reach the dialog with -- the toolbar is all a test has.
	if ( ! sidebarOpen ) {
		return { setAttributes, container };
	}

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
	beforeEach( () => {
		// setup() sets this per test; reset it for the helpers that render directly.
		isSidebarOpen = true;
		subjectFields = SUBJECT_FIELDS;
		formFieldIds = [];
		mockUpdateBlockAttributes.mockClear();
		mockFixDuplicateFieldId.mockClear();
	} );

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

		// The conditions themselves, not a count of them: an author should be able to read what
		// the field does without opening the dialog.
		expect( screen.getByText( 'This field is shown only if:' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Name (Name field) is “x”' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Budget (Number input field) is at least “5”' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Edit conditions' } ) ).toBeInTheDocument();
	} );

	// The same store action the block list uses, so pointing at a condition shows you which
	// field it refers to on the canvas rather than leaving you to find it by name.
	it( 'highlights the subject block while a condition is hovered', async () => {
		mockToggleBlockHighlight.mockClear();
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		// Hovering the text is enough: React fires onMouseEnter on the line when the pointer
		// enters any of its children.
		const line = screen.getByText( 'Name (Name field) is “x”' );

		await userEvent.hover( line );
		expect( mockToggleBlockHighlight ).toHaveBeenCalledWith( 'c-name', true );

		await userEvent.unhover( line );
		expect( mockToggleBlockHighlight ).toHaveBeenCalledWith( 'c-name', false );
	} );

	it( 'summarises a hide action and an any match', async () => {
		await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ], { action: 'hide' } ),
			{ openModal: false }
		);

		expect( screen.getByText( 'This field is hidden only if:' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Name (Name field) is “x”' ) ).toBeInTheDocument();
	} );

	// The toolbar button reports the same thing the inspector summary does, for an author who
	// is looking at the canvas rather than the sidebar.
	it( 'adds a toolbar button once the field has conditions', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		expect(
			screen.getByRole( 'button', {
				name: 'This field is shown only if: Name (Name field) is “x”',
			} )
		).toBeInTheDocument();
	} );

	// The same treatment Required uses: inverted while the field carries conditions.
	it( 'inverts the toolbar button while conditions exist', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		expect(
			screen.getByRole( 'button', {
				name: 'This field is shown only if: Name (Name field) is “x”',
			} )
		).toHaveClass( 'is-pressed' );
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

	// The toolbar button exists so an author can reach the builder from the canvas, which is
	// exactly the situation in which the settings sidebar is likely to be closed. The dialog
	// therefore cannot live inside InspectorControls: a fill whose slot is unmounted renders
	// nothing, so the click would flip the open state and produce no dialog at all.
	it.each( [
		[ 'a field with no conditions', DEFAULT_ATTRIBUTE, 'Add conditional logic' ],
		[
			'a field that already has one',
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ),
			'This field is shown only if: Name (Name field) is “x”',
		],
	] )(
		'opens the dialog from the toolbar of %s while the sidebar is closed',
		async ( _label, conditionalLogic, buttonName ) => {
			await setup( conditionalLogic, { sidebarOpen: false, openModal: false } );

			// Guards the premise: with the sidebar closed the inspector panel really is absent,
			// so the toolbar button is the only way in.
			expect(
				screen.queryByRole( 'button', { name: 'Conditional logic' } )
			).not.toBeInTheDocument();

			await userEvent.click( screen.getByRole( 'button', { name: buttonName } ) );

			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		}
	);

	it( 'opens the dialog from the toolbar button', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			openModal: false,
		} );

		await userEvent.click(
			screen.getByRole( 'button', {
				name: 'This field is shown only if: Name (Name field) is “x”',
			} )
		);

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	// Two fields can share an id -- ids survive copy, paste and duplicate, and the Name
	// field's inserter variations ship fixed ones. A rule stores the id of the field it
	// compares against, so a shared id cannot say which field is meant. The builder refuses to
	// offer those fields and explains how to fix it, rather than choosing for the author.
	describe( 'fields that share a Name/ID', () => {
		const nameField = ( clientId, label ) => ( {
			clientId,
			id: 'first-name',
			label,
			typeLabel: 'Name field',
			typeKey: 'string',
			options: [],
			step: null,
		} );

		beforeEach( () => {
			subjectFields = [
				nameField( 'c-a', 'First name' ),
				nameField( 'c-b', 'Partner first name' ),
			];
			formFieldIds = [ 'first-name', 'first-name' ];
		} );

		it( 'names the duplicated Name/ID and says how to fix it', async () => {
			await setup( DEFAULT_ATTRIBUTE );

			// `Notice` announces itself through @wordpress/a11y, which mirrors the text into a
			// live region -- so every notice matches twice. Either copy carries the whole message.
			const [ notice ] = screen.getAllByText(
				/Some fields are unavailable because their Name\/ID isn't unique: first-name/
			);

			expect( notice ).toHaveTextContent( /Advanced → Name\/ID/ );
		} );

		it( 'still lists the fields, marked and disabled', async () => {
			await setup( DEFAULT_ATTRIBUTE );

			const first = screen.getByRole( 'option', {
				name: 'First name (Name field) — duplicate Name/ID',
			} );
			const second = screen.getByRole( 'option', {
				name: 'Partner first name (Name field) — duplicate Name/ID',
			} );

			expect( first ).toBeDisabled();
			expect( second ).toBeDisabled();
		} );

		// The whole point of the change: nothing is renamed on the author's behalf.
		it( 'writes no ids', async () => {
			await setup( DEFAULT_ATTRIBUTE );

			expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
		} );

		// The status icon must not say "active" while the notice beside it says the condition
		// cannot tell which field it means. The subject resolves -- to whichever field claims
		// the id first -- so shape alone would call this complete.
		it( 'does not show an ambiguous condition as active', async () => {
			await setup( withRules( [ { field: 'first-name', operator: 'is', value: 'x' } ] ) );

			expect(
				screen.queryByRole( 'img', { name: 'This condition is active.' } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'img', {
					name: 'More than one field uses this Name/ID, so this condition cannot say which it means.',
				} )
			).toBeInTheDocument();
		} );

		// Offered, not done for them: renaming a field changes the key its responses are
		// stored under, so it waits for a deliberate click.
		it( 'offers to repair the collision, and repairs the id the rule names', async () => {
			await setup( withRules( [ { field: 'first-name', operator: 'is', value: 'x' } ] ) );

			await userEvent.click( screen.getByRole( 'button', { name: 'Fix it' } ) );

			expect( mockFixDuplicateFieldId ).toHaveBeenCalledWith( 'first-name' );
		} );

		// Nothing to repair when the field is simply gone.
		it( 'offers no repair for a condition whose field was deleted', async () => {
			await setup( withRules( [ { field: 'deleted_1', operator: 'is', value: 'x' } ] ) );

			expect( screen.queryByRole( 'button', { name: 'Fix it' } ) ).not.toBeInTheDocument();
		} );

		// A rule saved before the ids collided, or against a field that was later duplicated.
		// The message hangs under the subject control it is about, not over the whole row.
		it( 'explains a stored condition that names a shared id, under its field', async () => {
			await setup( withRules( [ { field: 'first-name', operator: 'is', value: 'x' } ] ) );

			expect(
				within( screen.getByRole( 'dialog' ) ).getByText(
					/Field Name\/ID first-name is not unique/
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'leaves fields with distinct ids selectable and unremarked', async () => {
		formFieldIds = [ 'name_1', 'budget_1' ];

		await setup( DEFAULT_ATTRIBUTE );

		expect( screen.queryAllByText( /duplicate Name\/ID/ ) ).toHaveLength( 0 );
		expect( screen.getByRole( 'option', { name: 'Name (Name field)' } ) ).toBeEnabled();
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

		// The clause finishing the sentence sits underneath rather than being interleaved
		// with the controls, and states the default the selectors do not.
		expect(
			screen.getByText( 'This field is hidden by default, until the following conditions are met:' )
		).toBeInTheDocument();
	} );

	// A hide rule inverts the default: the field is there until something removes it.
	it( 'states the opposite default for a hide action', async () => {
		await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ], { action: 'hide' } )
		);

		expect(
			screen.getByText(
				'This field is visible by default, until the following conditions are met:'
			)
		).toBeInTheDocument();
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

		// Below the row it belongs to. Screen readers get the same reason from the status
		// icon's label, which is asserted separately.
		expect(
			within( screen.getByRole( 'dialog' ) ).getByText( /no longer exists/i )
		).toBeInTheDocument();
	} );

	// A condition naming no subject, or giving no value where one is needed, is skipped by both
	// evaluators. Letting an author stack up rules that quietly do nothing is the trap here.
	// A condition naming no subject, or giving no value where one is needed, is skipped by
	// both evaluators. The badge makes that visible rather than the field silently not
	// reacting, which is why the Add button no longer has to police it.
	it( 'flags an unfinished condition and says what to do', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: '' } ] ) );

		// Queried by label, not text: a tooltip renders nothing until hovered, so the reason
		// has to be on the icon itself to be reachable at all.
		expect( screen.getByLabelText( 'Give this condition a value.' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'This condition is active.' ) ).not.toBeInTheDocument();
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

	// The builder opens with one empty row, so amber there warned about something the author
	// had not done yet. It is kept for a condition begun and left unfinished.
	it( 'stays neutral on a condition nobody has started', async () => {
		await setup( withRules( [] ) );

		const status = screen.getByLabelText( 'Choose a field to compare against.' );

		expect( status ).toHaveClass( 'is-unstarted' );
		expect( status ).not.toHaveClass( 'is-active' );
	} );

	it( 'warns once a condition has been started and left unfinished', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: '' } ] ) );

		const status = screen.getByLabelText( 'Give this condition a value.' );

		expect( status ).not.toHaveClass( 'is-unstarted' );
		expect( status ).not.toHaveClass( 'is-active' );
	} );

	it( 'marks a complete condition as active', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

		expect( screen.getByLabelText( 'This condition is active.' ) ).toBeInTheDocument();
	} );

	it( 'explains an inactive condition whose field was deleted', async () => {
		await setup( withRules( [ { field: 'deleted_1', operator: 'is', value: 'x' } ] ) );

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
						// Carried over: both subjects compare textually.
						rules: [ { field: 'untitled-field', operator: 'is', value: 'x' } ],
					},
				],
			} ),
		} );
	} );

	/**
	 * useSubjectFields excludes the field owning the panel, so the owner's id is the one the
	 * used-id list cannot see. It has to be passed in explicitly, or an unnamed sibling whose
	 * label slugifies to the same thing is handed the owner's id -- and PHP's duplicate guard
	 * then renames whichever parses second, repointing the rule or changing the owner's
	 * response key. The de-duplication itself is covered in use-subject-fields.test.jsx.
	 */
	it( "feeds the panel's own field id into the uniqueness check", async () => {
		mockEnsureFieldId.mockClear();
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ), {
			ownFieldId: 'email',
		} );

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), 'clientId:c-colour' );

		expect( mockEnsureFieldId ).toHaveBeenCalledWith(
			expect.objectContaining( { clientId: 'c-colour' } ),
			expect.arrayContaining( [ 'email' ] )
		);
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

	/**
	 * The value box is offered before a subject is chosen, so filling it in first is a normal
	 * order to work in -- and choosing the subject used to wipe it. It is kept only where the
	 * new subject can still show it.
	 */
	it.each( [
		[ 'keeps a value typed before the subject was chosen', 'iPhone', 'name_1', 'is', 'iPhone' ],
		// A checkbox compares against nothing, so the value has to go rather than sit unseen.
		[ 'drops it for a subject that takes no value', 'iPhone', 'terms_1', 'is_checked', '' ],
		[ 'keeps it for a dropdown that offers it', 'Large', 'size_1', 'is', 'Large' ],
		// Padding is what the representability check ignores, so it must not survive into the
		// stored value: a dropdown has no option named "  Large  " and would render blank.
		[
			'stores a padded value the way the control can show it',
			'  Large  ',
			'size_1',
			'is',
			'Large',
		],
		[ 'trims a padded number too', ' 10 ', 'budget_1', 'equals', '10' ],
	] )( '%s', async ( _name, typed, selection, operator, expected ) => {
		const { setAttributes } = await setup(
			withRules( [ { field: '', operator: 'is', value: typed } ] )
		);

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), selection );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				groups: [
					{
						logicalOperator: 'all',
						rules: [ { field: selection, operator, value: expected } ],
					},
				],
			} ),
		} );
	} );

	/**
	 * Clearing the subject puts the row back where it started, which is a place the value box
	 * is still offered -- so wiping the value would throw away something the author can still
	 * see and is still allowed to type. It is representability that decides, and there is no
	 * subject yet to decide it against.
	 */
	it( 'keeps the value when the subject is cleared again', async () => {
		const { setAttributes } = await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'iPhone' } ] )
		);

		await userEvent.selectOptions( screen.getByLabelText( 'Field' ), '' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				groups: [
					{
						logicalOperator: 'all',
						rules: [ { field: '', operator: 'is', value: 'iPhone' } ],
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
