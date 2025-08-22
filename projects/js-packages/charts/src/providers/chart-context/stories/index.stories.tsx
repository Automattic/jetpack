import { Meta, StoryObj } from '@storybook/react';
import {
	LineChart,
	BarChart,
	PieSemiCircleChart,
	PieChart,
	BarListChart,
	DataPointPercentage,
	SeriesData,
	ThemeProvider,
} from '../../../.';
import { sharedDecorator } from '../../../stories/decorator-config';
import { olympicMedals, temperatureData, barListSample } from '../../../stories/sample-data';
import { themeArgTypes, defaultThemeArgs, buildCustomTheme } from '../../../stories/theme-config';
import { jetpackTheme, wooTheme } from '../../theme/themes';
import { GlobalChartsProvider } from '../global-charts-provider';

type StoryArgs = {
	theme?: string;
	customColors?: string[];
	color1?: string;
	color2?: string;
	color3?: string;
	color4?: string;
	color5?: string;
	// For nested themes story
	lineColor?: string;
	barColor?: string;
	pieColor?: string;
	barListColor?: string;
	donutColor1?: string;
	donutColor2?: string;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Chart Context',
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
	argTypes: {
		...themeArgTypes,
		customColors: {
			control: false, // Hide the array control, we'll use individual color pickers
			table: { category: 'Custom Theme' },
			description: 'Array of custom colors for theme creation',
		},
		color1: {
			control: { type: 'color' },
			table: { category: 'Custom Colors' },
			description: 'First theme color',
		},
		color2: {
			control: { type: 'color' },
			table: { category: 'Custom Colors' },
			description: 'Second theme color',
		},
		color3: {
			control: { type: 'color' },
			table: { category: 'Custom Colors' },
			description: 'Third theme color',
		},
		color4: {
			control: { type: 'color' },
			table: { category: 'Custom Colors' },
			description: 'Fourth theme color',
		},
		color5: {
			control: { type: 'color' },
			table: { category: 'Custom Colors' },
			description: 'Fifth theme color',
		},
		lineColor: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Line Chart (top-left)',
		},
		barColor: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Bar Chart (top-right)',
		},
		pieColor: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Semi-Circle Chart (middle-left)',
		},
		barListColor: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Bar List Chart (middle-right)',
		},
		donutColor1: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Donut Chart (bottom-right, with hole)',
		},
		donutColor2: {
			control: { type: 'color' },
			table: { category: 'Individual Chart Colors' },
			description: 'Override primary color for Regular Pie Chart (bottom-left, full circle)',
		},
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

const barData: SeriesData[] = [ olympicMedals[ 0 ], olympicMedals[ 1 ], olympicMedals[ 2 ] ];

const lineData: SeriesData[] = [ temperatureData[ 0 ], temperatureData[ 1 ] ];

const pieData: DataPointPercentage[] = [
	{
		label: 'United States',
		value: 80000,
		valueDisplay: '80K',
		percentage: 65,
	},
	{
		label: 'Great Britain',
		value: 30000,
		valueDisplay: '30K',
		percentage: 25,
	},
	{
		label: 'Japan',
		value: 22000,
		valueDisplay: '22K',
		percentage: 10,
	},
];

// Data for Bar List Chart
const barListData: SeriesData[] = barListSample;

// Data for Donut Chart (uses PieChart with thickness)
const donutData: DataPointPercentage[] = [
	{
		label: 'United States',
		value: 80000,
		valueDisplay: '80K',
		percentage: 65,
	},
	{
		label: 'Great Britain',
		value: 30000,
		valueDisplay: '30K',
		percentage: 25,
	},
	{
		label: 'Japan',
		value: 22000,
		valueDisplay: '22K',
		percentage: 10,
	},
];

// Reusable grid component
const ChartGrid = ( {
	lineChartData,
	barChartData,
	pieChartData,
	barListChartData,
	donutChartData,
}: {
	lineChartData: SeriesData[];
	barChartData: SeriesData[];
	pieChartData: DataPointPercentage[];
	barListChartData: SeriesData[];
	donutChartData: DataPointPercentage[];
} ) => {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(2, 1fr)',
				gap: '4rem',
				width: '100%',
			} }
		>
			<LineChart
				data={ lineChartData }
				width={ 350 }
				height={ 250 }
				withGradientFill={ false }
				withLegendGlyph={ false }
				withTooltips={ true }
				margin={ { bottom: 40 } }
			/>

			<BarChart
				data={ barChartData }
				width={ 350 }
				height={ 250 }
				withTooltips={ true }
				showLegend={ true }
			/>

			<PieSemiCircleChart
				data={ pieChartData }
				width={ 350 }
				label="Semi-Circle Chart"
				withTooltips={ true }
				showLegend={ true }
			/>

			<BarListChart data={ barListChartData } width={ 350 } height={ 250 } withTooltips={ true } />

			<PieChart size={ 300 } data={ pieChartData } withTooltips={ true } showLegend={ true } />

			<PieChart
				size={ 300 }
				thickness={ 0.5 }
				data={ donutChartData }
				withTooltips={ true }
				showLegend={ true }
			/>
		</div>
	);
};

export const Default: Story = {
	parameters: {
		controls: {
			exclude: [
				'color1',
				'color2',
				'color3',
				'color4',
				'color5',
				'lineColor',
				'barColor',
				'pieColor',
				'barListColor',
				'donutColor1',
				'donutColor2',
				'customColors',
			],
		},
	},
	render: () => (
		<GlobalChartsProvider>
			<ChartGrid
				lineChartData={ lineData }
				barChartData={ barData }
				pieChartData={ pieData }
				barListChartData={ barListData }
				donutChartData={ donutData }
			/>
		</GlobalChartsProvider>
	),
};

export const JetpackTheme: Story = {
	parameters: {
		controls: {
			exclude: [
				'color1',
				'color2',
				'color3',
				'color4',
				'color5',
				'lineColor',
				'barColor',
				'pieColor',
				'barListColor',
				'donutColor1',
				'donutColor2',
				'customColors',
			],
		},
	},
	render: () => (
		<GlobalChartsProvider theme={ jetpackTheme }>
			<ChartGrid
				lineChartData={ lineData }
				barChartData={ barData }
				pieChartData={ pieData }
				barListChartData={ barListData }
				donutChartData={ donutData }
			/>
		</GlobalChartsProvider>
	),
};

export const WooTheme: Story = {
	parameters: {
		controls: {
			exclude: [
				'color1',
				'color2',
				'color3',
				'color4',
				'color5',
				'lineColor',
				'barColor',
				'pieColor',
				'barListColor',
				'donutColor1',
				'donutColor2',
				'customColors',
			],
		},
	},
	render: () => (
		<GlobalChartsProvider theme={ wooTheme }>
			<ChartGrid
				lineChartData={ lineData }
				barChartData={ barData }
				pieChartData={ pieData }
				barListChartData={ barListData }
				donutChartData={ donutData }
			/>
		</GlobalChartsProvider>
	),
};

export const CustomColors: Story = {
	args: {
		...defaultThemeArgs,
		customColors: [ '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57' ],
		color1: '#FF6B6B',
		color2: '#4ECDC4',
		color3: '#45B7D1',
		color4: '#96CEB4',
		color5: '#FECA57',
	},
	render: args => {
		// Build colors array from individual color controls
		const colors = [
			args.color1 || '#FF6B6B',
			args.color2 || '#4ECDC4',
			args.color3 || '#45B7D1',
			args.color4 || '#96CEB4',
			args.color5 || '#FECA57',
		].filter( Boolean );

		const theme = buildCustomTheme( colors );

		// Create a key from colors to force re-render when colors change
		const themeKey = colors.join( '-' );

		return (
			<GlobalChartsProvider key={ themeKey } theme={ theme }>
				<ChartGrid
					lineChartData={ lineData }
					barChartData={ barData }
					pieChartData={ pieData }
					barListChartData={ barListData }
					donutChartData={ donutData }
				/>
			</GlobalChartsProvider>
		);
	},
	parameters: {
		controls: {
			exclude: [
				'lineColor',
				'barColor',
				'pieColor',
				'barListColor',
				'donutColor1',
				'donutColor2',
			],
		},
		docs: {
			description: {
				story:
					'Interactive custom color theme with individual color picker controls. Use the color pickers in the controls panel to see real-time changes across all chart types.',
			},
		},
	},
};

export const NestedThemes: Story = {
	args: {
		...defaultThemeArgs,
		lineColor: '#FF6B6B',
		barColor: '#2ECC71',
		pieColor: '#E91E63',
		barListColor: '#F9CA24',
		donutColor1: '#EB4D4B', // Donut chart (with hole)
		donutColor2: '#F0932B', // Regular pie chart (full circle)
	},
	render: args => {
		return (
			<GlobalChartsProvider theme={ wooTheme }>
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gap: '4rem',
						width: '100%',
					} }
				>
					<ThemeProvider
						theme={ {
							colors: [ args.lineColor || '#FF6B6B', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<LineChart
							data={ lineData }
							width={ 350 }
							height={ 250 }
							withGradientFill={ false }
							withLegendGlyph={ false }
							withTooltips={ true }
							margin={ { bottom: 40 } }
						/>
					</ThemeProvider>

					<ThemeProvider
						theme={ {
							colors: [ args.barColor || '#2ECC71', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<BarChart
							data={ barData }
							width={ 350 }
							height={ 250 }
							withTooltips={ true }
							showLegend={ true }
						/>
					</ThemeProvider>

					<ThemeProvider
						theme={ {
							colors: [ args.pieColor || '#E91E63', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<PieSemiCircleChart
							data={ pieData }
							width={ 350 }
							label="Semi-Circle Chart"
							withTooltips={ true }
							showLegend={ true }
						/>
					</ThemeProvider>

					<ThemeProvider
						theme={ {
							colors: [ args.barListColor || '#F9CA24', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<BarListChart data={ barListData } width={ 350 } height={ 250 } withTooltips={ true } />
					</ThemeProvider>

					<ThemeProvider
						theme={ {
							colors: [ args.donutColor2 || '#F0932B', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<PieChart size={ 300 } data={ pieData } withTooltips={ true } showLegend={ true } />
					</ThemeProvider>

					<ThemeProvider
						theme={ {
							colors: [ args.donutColor1 || '#EB4D4B', ...( wooTheme.colors?.slice( 1 ) || [] ) ],
						} }
					>
						<PieChart
							size={ 300 }
							thickness={ 0.5 }
							data={ donutData }
							withTooltips={ true }
							showLegend={ true }
						/>
					</ThemeProvider>
				</div>
			</GlobalChartsProvider>
		);
	},
	parameters: {
		controls: {
			exclude: [ 'color1', 'color2', 'color3', 'color4', 'color5', 'customColors' ],
		},
		docs: {
			description: {
				story:
					'**Theme Inheritance & Selective Overriding**: This story demonstrates how to maintain design consistency while allowing customization. All charts inherit from the global WooCommerce theme (fonts, spacing, secondary colors) but each chart can override its primary color using nested ThemeProvider components. This pattern is useful for dashboard sections that need different primary colors while maintaining overall brand consistency. Each color control overrides only the first color in the theme palette - all other theme properties are inherited.',
			},
		},
	},
};
