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
import { legendArgTypes } from '../../../stories/legend-config';
import { formatMetricValue, hexToRgba } from '../../../utils';
import LeaderboardChart from '../leaderboard-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LeaderboardChart > >;

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
		legendShapeWidth: {
			control: 'number',
			description: 'Width of legend shapes in pixels',
			table: {
				category: 'Legend',
				type: { summary: 'number' },
				defaultValue: { summary: '8' },
			},
		},
		legendShapeHeight: {
			control: 'number',
			description: 'Height of legend shapes in pixels',
			table: {
				category: 'Legend',
				type: { summary: 'number' },
				defaultValue: { summary: '8' },
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
		legendShapeWidth: 8,
		legendShapeHeight: 8,
		withOverlayLabel: false,
	},
	decorators: [ chartDecorator ],
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

export const Loading: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: true,
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
			fontFamily: `"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`,
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
};

export const CustomLegendLabels: Story = {
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
};

export const WithCompositionLegend: Story = {
	render: args => (
		<div
			style={ {
				display: 'grid',
				gap: '2rem',
				gridTemplateColumns: 'repeat(2, 1fr)',
				alignItems: 'start',
			} }
		>
			<div>
				<h3 style={ { marginTop: 0, marginBottom: '1rem' } }>Traditional Props-based Legend</h3>
				<LeaderboardChart { ...args } showLegend={ true } />
			</div>
			<div>
				<h3 style={ { marginTop: 0, marginBottom: '1rem' } }>
					Composition API with Legend Component
				</h3>
				<LeaderboardChart { ...args }>
					<LeaderboardChart.Legend
						shape="circle"
						shapeWidth={ 8 }
						shapeHeight={ 8 }
						style={ { marginTop: '16px' } }
					/>
				</LeaderboardChart>
			</div>
		</div>
	),
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		legendLabels: {
			primary: 'Aug 11-Sep 9, 2025',
			comparison: 'Jul 11-Aug 11, 2025',
		},
	},
	argTypes: {
		legendInteractive: {
			table: { disable: true },
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates the composition API allowing flexible component composition. The chart can be used with traditional props or with explicit child components for more control over legend positioning and styling.',
			},
		},
	},
};

export const InteractiveLegend: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
		legendInteractive: true,
		legendLabels: {
			primary: 'Current period',
			comparison: 'Previous period',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive legend allows users to click legend items to toggle the visibility of current and previous period data. Click on the legend items to show/hide the corresponding bars and values. When all series are hidden, a message is displayed.',
			},
		},
	},
};
