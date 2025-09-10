import { defaultTheme } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	trafficSourcesData as sampleData,
	shortTrafficSourcesData as smallDataset,
	revenueMetricsData as largeValues,
	decliningMetricsData as negativeGrowth,
	categorizedMetricsData as dataWithImageColor,
	themeArgTypes,
	CHART_THEME_MAP,
} from '../../../stories';
import { legendArgTypes } from '../../../stories/legend-config';
import { formatMetricValue } from '../../../utils';
import { hexToRgba } from '../../../utils/color-utils';
import LeaderboardChart from '../leaderboard-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LeaderboardChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Leaderboard Chart',
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
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
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

export const WithLegend: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
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
	render: args => {
		const themeName = args.themeName || 'default';
		const theme = CHART_THEME_MAP[ themeName ];
		const primaryColor =
			theme?.leaderboardChart?.primaryColor || defaultTheme.leaderboardChart.primaryColor;
		const primaryColorWithAlpha = hexToRgba( primaryColor, 0.08 );

		return <LeaderboardChart { ...args } primaryColor={ primaryColorWithAlpha } />;
	},
};
