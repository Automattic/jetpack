import { formatDate } from '@jetpack-premium-analytics/formatters';
import { ChartTooltip, type TooltipStyle } from '../chart-tooltip';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof ChartTooltip > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ChartTooltip',
	component: ChartTooltip,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj< typeof ChartTooltip >;

/**
 * Helper wrapper for tooltip stories with consistent background.
 */
const TooltipWrapper = ( { children }: { children: React.ReactNode } ) => (
	<div
		style={ {
			background: 'var(--wpds-color-background-surface-neutral)',
			padding: '20px',
			borderRadius: '8px',
		} }
	>
		{ children }
	</div>
);

/**
 * Line chart styles - solid and dashed lines
 */
const LINE_SERIES_STYLES: TooltipStyle[] = [
	{ stroke: '#3858E9', strokeWidth: 2 },
	{
		stroke: '#3858E9',
		strokeDasharray: '4 4',
		strokeWidth: 1.5,
		strokeDashoffset: 2,
	},
	{ stroke: '#3858E9', strokeDasharray: '2 2', strokeWidth: 1.5 },
];

/**
 * Bar chart styles - solid colors
 */
const BAR_SERIES_STYLES: TooltipStyle[] = [
	{ stroke: '#3858E9' },
	{ stroke: '#66BDFF' },
	{ stroke: '#A78BFA' },
];

/**
 * Custom label extractor for line chart datum (date-based).
 * Uses realDate for comparison series to show the actual date.
 *
 * @param datum - The data point with date information
 * @param index - Index of this entry in the tooltip
 * @param _key  - Series key (unused, date is extracted from datum)
 */
type LineDatum = { date: Date; realDate?: Date; value: number };
const getDateLabel = ( datum: LineDatum, index: number ): string => {
	const isComparison = index > 0;
	const displayDate = isComparison ? datum.realDate ?? datum.date : datum.date;
	return formatDate( displayDate );
};

/**
 * LineIndicatorTwoSeries: Line indicator with two series (primary + comparison).
 */
export const LineIndicatorTwoSeries: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-05' ),
								value: 2400,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								date: new Date( '2024-01-05' ),
								realDate: new Date( '2023-12-30' ),
								value: 2000,
							},
							index: 1,
							key: 'series-1',
						},
					},
				} }
				dataFormat={ { type: 'currency' } }
				seriesStyles={ LINE_SERIES_STYLES }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Line indicator showing primary and comparison periods. The dashed line differentiates the comparison series.',
			},
		},
	},
};

/**
 * LineIndicatorThreeSeries: Line indicator with three series.
 */
export const LineIndicatorThreeSeries: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-03' ),
								value: 1400,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								date: new Date( '2024-01-03' ),
								realDate: new Date( '2023-12-27' ),
								value: 1300,
							},
							index: 1,
							key: 'series-1',
						},
						'series-2': {
							datum: {
								date: new Date( '2024-01-03' ),
								realDate: new Date( '2023-12-20' ),
								value: 1100,
							},
							index: 2,
							key: 'series-2',
						},
					},
				} }
				dataFormat={ { type: 'currency' } }
				seriesStyles={ LINE_SERIES_STYLES }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Line indicator showing three periods with distinct dash patterns.',
			},
		},
	},
};

/**
 * RectIndicatorTwoSeries: Rectangle indicator for bar charts with two series.
 * Uses default getLabel which extracts datum.label.
 */
export const RectIndicatorTwoSeries: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								label: 'SUMMER20',
								value: 4500,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								label: 'WELCOME10',
								value: 3200,
							},
							index: 1,
							key: 'series-1',
						},
					},
				} }
				dataFormat={ { type: 'currency' } }
				seriesStyles={ BAR_SERIES_STYLES }
				indicatorType="rect"
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Rectangle indicator for bar charts. Uses different colors for each series.',
			},
		},
	},
};

/**
 * RectIndicatorSingleSeries: Rectangle indicator with single series.
 * Uses default getLabel which extracts datum.label.
 */
export const RectIndicatorSingleSeries: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								label: 'Desktop',
								value: 0.045,
							},
							index: 0,
							key: 'series-0',
						},
					},
				} }
				dataFormat={ { type: 'percentage' } }
				seriesStyles={ BAR_SERIES_STYLES }
				indicatorType="rect"
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Single series with rectangle indicator and percentage formatting.',
			},
		},
	},
};

/**
 * NumberFormat: Tooltip with number formatting.
 */
export const NumberFormat: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-03' ),
								value: 42,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								date: new Date( '2024-01-03' ),
								realDate: new Date( '2023-12-27' ),
								value: 38,
							},
							index: 1,
							key: 'series-1',
						},
					},
				} }
				dataFormat={ { type: 'number' } }
				seriesStyles={ LINE_SERIES_STYLES }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Tooltip with number formatting (no currency symbol).',
			},
		},
	},
};

/**
 * PercentageFormat: Tooltip with percentage formatting.
 */
export const PercentageFormat: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-03' ),
								value: 0.0325,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								date: new Date( '2024-01-03' ),
								realDate: new Date( '2023-12-27' ),
								value: 0.028,
							},
							index: 1,
							key: 'series-1',
						},
					},
				} }
				dataFormat={ { type: 'percentage' } }
				seriesStyles={ LINE_SERIES_STYLES }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Tooltip with percentage formatting.',
			},
		},
	},
};

/**
 * CurrencyFormat: Tooltip with currency formatting.
 */
export const CurrencyFormat: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-01' ),
								value: 12500,
							},
							index: 0,
							key: 'series-0',
						},
					},
				} }
				dataFormat={ { type: 'currency' } }
				seriesStyles={ LINE_SERIES_STYLES }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Single series tooltip with currency formatting.',
			},
		},
	},
};

/**
 * CustomStyles: Tooltip with custom color styles.
 */
export const CustomStyles: Story = {
	render: () => (
		<TooltipWrapper>
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'series-0': {
							datum: {
								date: new Date( '2024-01-05' ),
								value: 15000,
							},
							index: 0,
							key: 'series-0',
						},
						'series-1': {
							datum: {
								date: new Date( '2024-01-05' ),
								realDate: new Date( '2023-12-30' ),
								value: 12000,
							},
							index: 1,
							key: 'series-1',
						},
					},
				} }
				dataFormat={ { type: 'currency' } }
				seriesStyles={ [
					{ stroke: '#10B981', strokeWidth: 2 },
					{
						stroke: '#F59E0B',
						strokeDasharray: '4 4',
						strokeWidth: 1.5,
						strokeDashoffset: 2,
					},
				] }
				indicatorType="line"
				getLabel={ getDateLabel }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Tooltip with custom green and orange colors instead of the default blue.',
			},
		},
	},
};
