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
	controls: {},
};

const withRules = ( rules, extra = {} ) => ( {
	enabled: true,
	action: 'show',
	logicalOperator: 'all',
	controls: { fieldValue: { rules } },
	...extra,
} );

const setup = async ( conditionalLogic = DEFAULT_ATTRIBUTE ) => {
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

	return { setAttributes, container };
};

const optionValues = select =>
	within( select )
		.getAllByRole( 'option' )
		.map( o => o.value );

describe( 'ConditionalLogicPanel', () => {
	it( 'renders the panel title', async () => {
		await setup();
		expect( screen.getByText( 'Conditional logic' ) ).toBeInTheDocument();
	} );

	it( 'shows the Add condition button with no conditions configured', async () => {
		await setup();
		expect( screen.getByRole( 'button', { name: /add condition/i } ) ).toBeInTheDocument();
	} );

	// `enabled` is derived from whether any rule exists, so a field only carries conditional
	// logic once it actually has a condition.
	it( 'enables logic when the first condition is added', async () => {
		const { setAttributes } = await setup();
		await userEvent.click( screen.getByRole( 'button', { name: /add condition/i } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				enabled: true,
				controls: { fieldValue: { rules: [ { field: '', operator: 'is', value: '' } ] } },
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
				controls: { fieldValue: { rules: [] } },
			} ),
		} );
	} );

	it( 'hides the action and match selectors until a condition exists', async () => {
		await setup();
		expect( screen.queryByLabelText( 'Action' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the action and match selectors once a condition exists', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );
		expect( screen.getByLabelText( 'Action' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'When' ) ).toBeInTheDocument();
	} );

	// The single-row arrangement itself is CSS; what this can verify is that both selectors
	// render together and that the sentence they belong to follows them rather than being
	// interleaved, which is what wrapped badly before.
	it( 'renders both selectors above the conditions sentence', async () => {
		const { container } = await setup(
			withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] )
		);

		expect( screen.getByLabelText( 'Action' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'When' ) ).toBeInTheDocument();
		expect(
			within( container ).getByText( 'of the following conditions are met:' )
		).toBeInTheDocument();
	} );

	it( 'phrases the match options to read on from the action', async () => {
		await setup( withRules( [ { field: 'name_1', operator: 'is', value: 'x' } ] ) );

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
		// Scoped to the rendered container: Notice mirrors its text into an aria-live region
		// that WordPress appends to document.body, which would match twice.
		const { container } = await setup(
			withRules( [ { field: 'deleted_1', operator: 'is', value: 'x' } ] )
		);
		expect( within( container ).getByText( /no longer exists/i ) ).toBeInTheDocument();
	} );

	it( 'adds a condition with no subject chosen yet', async () => {
		const { setAttributes } = await setup( withRules( [] ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Add condition' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			conditionalLogic: expect.objectContaining( {
				controls: {
					fieldValue: { rules: [ { field: '', operator: 'is', value: '' } ] },
				},
			} ),
		} );
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
				controls: {
					fieldValue: {
						rules: [ { field: 'untitled-field', operator: 'is', value: '' } ],
					},
				},
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
				controls: {
					fieldValue: { rules: [ { field: 'budget_1', operator: 'equals', value: '' } ] },
				},
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
				controls: {
					fieldValue: { rules: [ { field: 'budget_1', operator: 'gte', value: '5' } ] },
				},
			} ),
		} );
	} );
} );
