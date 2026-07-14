import { Stack } from '@wordpress/ui';
import { action } from 'storybook/actions';
import { defaultTheme, useGlobalChartsContext } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	trafficSourcesData as sampleData,
	shortTrafficSourcesData as smallDataset,
	revenueMetricsData as largeValues,
	decliningMetricsData as negativeGrowth,
	categorizedMetricsData as dataWithImageColor,
	themeArgTypes,
} from '../../../stories';
import {
	legendArgTypes,
	extractLegendConfig,
	type LegendStoryControls,
} from '../../../stories/legend-config';
import { formatMetricValue, hexToRgba } from '../../../utils';
import LeaderboardChart from '../leaderboard-chart';
import type { ChartLegendConfig, LeaderboardEntry } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LeaderboardChart > > &
	LegendStoryControls;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Leaderboard Chart',
	component: LeaderboardChart,
	parameters: {
		layout: 'centered',
	},
	tags: [ 'autodocs' ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Array of leaderboard entries to display',
			table: {
				type: { summary: 'LeaderboardEntry[]' },
			},
		},
		withComparison: {
			control: 'boolean',
			description: 'Whether to show comparison data (previous period bars and delta values)',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		primaryColor: {
			control: 'color',
			description: 'Primary color for current period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.primaryColor },
			},
		},
		secondaryColor: {
			control: 'color',
			description: 'Secondary color for comparison period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.secondaryColor },
			},
		},
		valueFormatter: {
			control: false,
			description: 'Custom formatter function for values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue with compact notation' },
			},
		},
		deltaFormatter: {
			control: false,
			description: 'Custom formatter function for delta values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue as percentage' },
			},
		},
		loading: {
			control: 'boolean',
			description: 'Whether the chart is in loading state',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name for the chart container',
			table: {
				type: { summary: 'string' },
			},
		},
		style: {
			control: 'object',
			description: 'Custom styling for the chart container',
			table: {
				type: { summary: 'React.CSSProperties' },
			},
		},
		withOverlayLabel: {
			control: 'boolean',
			description: 'Whether to overlay the label on top of the bar',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		legendLabels: {
			control: 'object',
			description: 'Custom labels for legend items',
			table: {
				category: 'Legend',
				type: { summary: '{ primary?: string; comparison?: string }' },
				defaultValue: { summary: 'undefined' },
			},
		},
		...sharedChartArgTypes,
		...legendArgTypes,
		...themeArgTypes,
	},
	args: {
		primaryColor: undefined,
		secondaryColor: undefined,
		themeName: 'default',
		showLegend: false,
		legendPosition: 'bottom',
		legendAlignment: 'center',
		legendOrientation: 'horizontal',
		legendShape: 'circle',
		withOverlayLabel: false,
	},
	decorators: [ chartDecorator ],
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< LeaderboardEntry > >( args );
		return <LeaderboardChart { ...args } legend={ legend } />;
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		data: sampleData,
		withComparison: true,
		loading: false,
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 300,
		height: 400,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.4,
	},
};

export const WithoutComparison: Story = {
	args: {
		data: sampleData,
		withComparison: false,
		loading: false,
	},
};

export const WithOverlayLabel: Story = {
	args: {
		data: sampleData,
		withOverlayLabel: true,
	},
};

const missingComparisonData: LeaderboardEntry[] = sampleData.map( entry =>
	entry.id === 'social' || entry.id === 'referral'
		? {
				id: entry.id,
				label: entry.label,
				currentValue: entry.currentValue,
				currentShare: entry.currentShare,
		  }
		: entry
);

export const MissingComparisonRows: Story = {
	args: {
		data: missingComparisonData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Rows without a matching comparison-period value ("Social Media" and "Referral" here) omit `previousValue`/`previousShare`/`delta`. Those rows render no comparison bar and show a placeholder in the delta column instead of a fabricated value.',
			},
		},
	},
};

export const MissingComparisonRowsWithOverlayLabel: Story = {
	args: {
		data: missingComparisonData,
		withComparison: true,
		withOverlayLabel: true,
		loading: false,
		style: {
			'--a8c--charts--leaderboard--bar--border-radius': '4px',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Missing comparison rows in the overlay-label variant, as used by the Premium Analytics Stats widgets. The delta column still shows a placeholder for rows without comparison data.',
			},
		},
	},
};

export const Loading: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: true,
	},
};

const onLeaderboardItemClick = action( 'leaderboard-item-click' );

export const Interactive: Story = {
	args: {
		data: sampleData.map( entry => ( {
			...entry,
			label: (
				<span
					style={ {
						display: 'flex',
						alignItems: 'center',
						minHeight: '40px',
						padding: '0 6px',
						fontSize: '13px',
					} }
				>
					{ entry.label }
				</span>
			),
			onClick: () => onLeaderboardItemClick( entry.id ),
		} ) ),
		withComparison: true,
		withOverlayLabel: true,
		style: {
			'--a8c--charts--leaderboard--bar--border-radius': '4px',
		},
	},
	render: args => <LeaderboardChartWithOverlayLabelImage { ...args } />,
	parameters: {
		docs: {
			description: {
				story:
					'Rows with an `onClick` become interactive: the whole row is clickable and keyboard-focusable (Enter/Space), with a chevron revealed on hover/focus. The consumer supplies the action (e.g. drill-down).',
			},
		},
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const CustomColors: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		primaryColor: 'red',
		secondaryColor: 'green',
	},
};

export const SmallDataset: Story = {
	args: {
		data: smallDataset,
		withComparison: true,
		loading: false,
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
	},
};

export const EmptyDataWithChildren: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
	},
	render: args => (
		<LeaderboardChart { ...args }>
			<Stack direction="row" gap="xs" align="center" justify="center">
				Child element
			</Stack>
		</LeaderboardChart>
	),
};

export const LargeValues: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,
	},
};

export const NegativeGrowth: Story = {
	args: {
		data: negativeGrowth,
		withComparison: true,
		loading: false,
	},
};

export const CurrencyFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'currency', {
				useMultipliers: true,
				decimals: 1,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 0,
			} ),
	},
};

export const NumberFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'number', {
				useMultipliers: false,
				decimals: 0,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
			} ),
	},
};

const CustomLabelComponent = ( { label, imageColor, style = {} } ) => (
	<div
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			...style,
		} }
	>
		<img
			src={ `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><rect width='50' height='50' fill='${ encodeURIComponent(
				imageColor
			) }'/></svg>` }
			alt="icon"
			style={ {
				width: '28px',
				height: '28px',
				verticalAlign: 'middle',
				borderRadius: '4px',
			} }
		/>
		<span style={ { fontSize: '13px' } }>{ label }</span>
	</div>
);

export const CustomLabel: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: <CustomLabelComponent label={ entry.label } imageColor={ entry.imageColor } />,
		} ) ),
		withComparison: false,
		loading: false,
	},
};

export const AdvancedFormatting: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) => {
			if ( value >= 1000000 ) {
				return formatMetricValue( value, 'currency', {
					useMultipliers: true,
					decimals: 1,
				} );
			}
			return formatMetricValue( value, 'currency', {
				useMultipliers: false,
				decimals: 0,
			} );
		},
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
				signDisplay: 'always',
			} ),
	},
};

const LeaderboardChartWithOverlayLabelImage = ( args: StoryArgs ) => {
	const { getElementStyles } = useGlobalChartsContext();
	const { color: primaryColor } = getElementStyles( {
		index: 0,
		overrideColor: args.primaryColor,
	} );

	const primaryColorWithAlpha = hexToRgba( primaryColor, 0.08 );

	return <LeaderboardChart { ...args } primaryColor={ primaryColorWithAlpha } />;
};

export const OverlayLabelWithImage: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: (
				<CustomLabelComponent
					label={ entry.label }
					imageColor={ entry.imageColor }
					style={ { padding: '6px' } }
				/>
			),
		} ) ),
		withComparison: true,
		withOverlayLabel: true,
		loading: false,
		style: {
			'--a8c--charts--leaderboard--bar--border-radius': '4px',
		},
	},
	render: args => <LeaderboardChartWithOverlayLabelImage { ...args } />,
};

export const WithLegend: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
			},
		},
	},
};

export const WithLegendLabels: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
		legendLabels: {
			primary: 'Aug 11-Sep 9, 2025',
			comparison: 'Jul 11-Aug 11, 2025',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend`, the `legend` config object, and the `legendLabels` prop to customize primary and comparison labels. Other legend options (position, alignment, orientation, shape, interactivity) can be adjusted via Storybook controls.',
			},
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< LeaderboardEntry > >( args );
		return (
			<LeaderboardChart
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-leaderboard-chart"
			>
				<LeaderboardChart.Legend
					{ ...legend }
					shapeStyles={ { width: 8, height: 8, ...legend?.shapeStyles } }
				/>
			</LeaderboardChart>
		);
	},
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<LeaderboardChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};
