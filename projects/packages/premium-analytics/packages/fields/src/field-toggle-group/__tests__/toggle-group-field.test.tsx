/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import ToggleGroupField, { hasIconOptions } from '../toggle-group-field';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';
import type { ReactElement } from 'react';

type ChartAttributes = { chartType?: string };

// `Option` carries no `icon`, so the icon-bearing fixtures name their own
// shape, the way `chartTypeAttributeField` builds its elements.
type IconOption = Option & { icon: ReactElement };

const ICON = <svg />;

const ICON_ELEMENTS = [
	{ value: 'line', label: 'Line chart', icon: ICON },
	{ value: 'bar', label: 'Bar chart', icon: ICON },
] satisfies IconOption[];

const TEXT_ELEMENTS: Option[] = [
	{ value: 'line', label: 'Line chart' },
	{ value: 'bar', label: 'Bar chart' },
];

function renderField( {
	elements,
	data = { chartType: 'line' },
	hideLabelFromVision = true,
	onChange = jest.fn(),
}: {
	elements: Option[];
	data?: ChartAttributes;
	hideLabelFromVision?: boolean;
	onChange?: jest.Mock;
} ) {
	const field = {
		id: 'chartType',
		label: 'Chart type',
		elements,
		getValue: ( { item }: { item: ChartAttributes } ) => item.chartType,
		setValue: ( { value: next }: { value: unknown } ) => ( { chartType: next } ),
		isDisabled: () => false,
	} as unknown as DataFormControlProps< ChartAttributes >[ 'field' ];

	render(
		<ToggleGroupField
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}

describe( 'hasIconOptions', () => {
	it( 'reports icons when every option carries one', () => {
		expect( hasIconOptions( ICON_ELEMENTS ) ).toBe( true );
	} );

	it( 'falls back to text when only some options carry an icon', () => {
		expect( hasIconOptions( [ ICON_ELEMENTS[ 0 ], TEXT_ELEMENTS[ 1 ] ] ) ).toBe( false );
	} );

	it( 'reports no icons for an empty list', () => {
		expect( hasIconOptions( [] ) ).toBe( false );
	} );
} );

describe( 'ToggleGroupField', () => {
	it( 'names every icon segment by its option label', () => {
		renderField( { elements: ICON_ELEMENTS } );

		expect( screen.getByRole( 'radio', { name: 'Line chart' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Bar chart' } ) ).toBeInTheDocument();
	} );

	it( 'marks the segment matching the current value as selected', () => {
		renderField( { elements: ICON_ELEMENTS, data: { chartType: 'bar' } } );

		expect( screen.getByRole( 'radio', { name: 'Bar chart' } ) ).toBeChecked();
		expect( screen.getByRole( 'radio', { name: 'Line chart' } ) ).not.toBeChecked();
	} );

	it( 'writes the selected option value on click', async () => {
		const onChange = jest.fn();
		renderField( { elements: ICON_ELEMENTS, onChange } );

		await userEvent.click( screen.getByRole( 'radio', { name: 'Bar chart' } ) );

		expect( onChange ).toHaveBeenCalledWith( { chartType: 'bar' } );
	} );

	it( 'selects the first option when the value is absent', () => {
		renderField( { elements: ICON_ELEMENTS, data: {} } );

		expect( screen.getByRole( 'radio', { name: 'Line chart' } ) ).toBeChecked();
	} );

	it( 'selects the first option when the value matches none', () => {
		renderField( { elements: ICON_ELEMENTS, data: { chartType: 'area' } } );

		expect( screen.getByRole( 'radio', { name: 'Line chart' } ) ).toBeChecked();
	} );

	it( 'labels the control where the label is visible', () => {
		renderField( { elements: TEXT_ELEMENTS, hideLabelFromVision: false } );

		expect( screen.getByText( 'Chart type' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing without options', () => {
		const { container } = render(
			<ToggleGroupField
				data={ {} }
				field={
					{
						id: 'chartType',
						label: 'Chart type',
						elements: [],
						getValue: () => undefined,
						setValue: () => ( {} ),
						isDisabled: () => false,
					} as unknown as DataFormControlProps< ChartAttributes >[ 'field' ]
				}
				onChange={ jest.fn() }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
