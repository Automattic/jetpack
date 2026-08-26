import { chartLine } from '@jetpack-premium-analytics/icons';
import { chartBar } from '@wordpress/icons';
import { useState } from 'react';
import ToggleGroupField from '../toggle-group-field';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';

type ChartAttributes = { chartType?: string };

// `Option` carries no `icon`, so the icon-bearing options name their own
// shape, the way `chartTypeAttributeField` builds its elements.
type IconOption = Option & { icon: ReactElement };

const CHART_TYPES = [
	{ value: 'line', label: 'Line chart', icon: chartLine },
	{ value: 'bar', label: 'Bar chart', icon: chartBar },
] satisfies IconOption[];

const GRANULARITIES: Option[] = [
	{ value: 'day', label: 'By days' },
	{ value: 'week', label: 'By weeks' },
	{ value: 'month', label: 'By months' },
];

const meta: Meta< typeof ToggleGroupField > = {
	title: 'Packages/Premium Analytics/Fields/ToggleGroupField',
	component: ToggleGroupField,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A DataForm edit control that lays a field’s `elements` out as segments ' +
					'of one row, so every option is visible and one click away. Use it for a ' +
					'short, stable set of mutually exclusive options; longer or open-ended ones ' +
					'belong in `SelectField`.\n\n' +
					'Options that all carry an `icon` render as square icon segments, with the ' +
					'label as the tooltip and the accessible name; anything else renders as text.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof ToggleGroupField >;

/**
 * Stands in for `DataForm`: holds the attribute the control writes, and hands
 * the field down the way the widget host does.
 */
function ToggleGroupFieldWithState( {
	label,
	elements,
	initialValue,
	hideLabelFromVision,
}: {
	label: string;
	elements: Option[];
	initialValue: string;
	hideLabelFromVision?: boolean;
} ) {
	const [ chartType, setChartType ] = useState( initialValue );

	const field = {
		id: 'chartType',
		label,
		elements,
		getValue: ( { item }: { item: ChartAttributes } ) => item.chartType,
		setValue: ( { value }: { value: unknown } ) => ( { chartType: value } ),
		isDisabled: () => false,
	} as unknown as DataFormControlProps< ChartAttributes >[ 'field' ];

	return (
		<ToggleGroupField
			data={ { chartType } }
			field={ field }
			onChange={ edits => setChartType( String( edits.chartType ) ) }
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}

/**
 * The `chartType` attribute as the widget host renders it inline in a chart
 * widget's header: the label is hidden, so the icons carry the meaning and
 * the control sizes to its content.
 */
export const Default: Story = {
	render: () => (
		<ToggleGroupFieldWithState
			label="Chart type"
			elements={ CHART_TYPES }
			initialValue="line"
			hideLabelFromVision
		/>
	),
};

/**
 * The same control in the widget controls popover, where the host shows the
 * label above the field.
 */
export const WithVisibleLabel: Story = {
	render: () => (
		<ToggleGroupFieldWithState label="Chart type" elements={ CHART_TYPES } initialValue="line" />
	),
};

/**
 * Options without icons fall back to text segments, which share the row width
 * evenly wherever the label is visible.
 */
export const TextOptions: Story = {
	render: () => (
		<ToggleGroupFieldWithState label="Group by" elements={ GRANULARITIES } initialValue="week" />
	),
};
