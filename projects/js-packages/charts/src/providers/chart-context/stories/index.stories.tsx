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
import {
	themeArgTypes,
	defaultThemeArgs,
	getThemeByName,
	COLOR_PRESETS,
	buildCustomTheme,
} from '../../../stories/theme-config';
import { jetpackTheme, wooTheme } from '../../theme/themes';
import { GlobalChartsProvider } from '../global-charts-provider';

type StoryArgs = {
	theme?: string;
	customColors?: string[];
	containerWidth?: string;
	containerHeight?: string;
	resize?: 'both' | 'horizontal' | 'vertical' | 'none';
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
			control: 'object',
			table: { category: 'Custom Theme' },
			description: 'Array of custom colors for theme creation',
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
		customColors: COLOR_PRESETS.earthy,
	},
	render: args => {
		const theme = args.customColors
			? buildCustomTheme( args.customColors )
			: getThemeByName( args.theme! );

		return (
			<GlobalChartsProvider theme={ theme }>
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
		docs: {
			description: {
				story:
					'Interactive custom color theme. Edit the customColors array in the controls to see real-time color changes across all chart types.',
			},
		},
	},
};

export const ColorPresets: Story = {
	render: () => {
		const presetEntries = Object.entries( COLOR_PRESETS );

		return (
			<div style={ { display: 'grid', gap: '3rem' } }>
				{ presetEntries.map( ( [ presetName, colors ] ) => (
					<div key={ presetName }>
						<h3 style={ { marginBottom: '1rem', textTransform: 'capitalize' } }>
							{ presetName } Preset
						</h3>
						<div style={ { display: 'flex', gap: '0.5rem', marginBottom: '1rem' } }>
							{ colors.map( ( color, index ) => (
								<div
									key={ index }
									style={ {
										width: '30px',
										height: '30px',
										backgroundColor: color,
										border: '1px solid #ccc',
										borderRadius: '4px',
									} }
									title={ color }
								/>
							) ) }
						</div>
						<GlobalChartsProvider theme={ buildCustomTheme( colors ) }>
							<div
								style={ { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' } }
							>
								<BarChart data={ barData } width={ 300 } height={ 200 } withTooltips={ true } />
								<LineChart
									data={ lineData }
									width={ 300 }
									height={ 200 }
									withTooltips={ true }
									withGradientFill={ false }
								/>
								<PieChart size={ 200 } data={ pieData } withTooltips={ true } />
							</div>
						</GlobalChartsProvider>
					</div>
				) ) }
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Showcase of all available color presets with live chart examples. Each preset demonstrates different color palettes suitable for various use cases.',
			},
		},
	},
};

export const NestedThemes: Story = {
	render: () => {
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
					<ThemeProvider theme={ { colors: [ '#FF6B6B', ...wooTheme.colors.slice( 1 ) ] } }>
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

					<ThemeProvider theme={ { colors: [ '#2ECC71', ...wooTheme.colors.slice( 1 ) ] } }>
						<BarChart
							data={ barData }
							width={ 350 }
							height={ 250 }
							withTooltips={ true }
							showLegend={ true }
						/>
					</ThemeProvider>

					<ThemeProvider theme={ { colors: [ '#E91E63', ...wooTheme.colors.slice( 1 ) ] } }>
						<PieSemiCircleChart
							data={ pieData }
							width={ 350 }
							label="Semi-Circle Chart"
							withTooltips={ true }
							showLegend={ true }
						/>
					</ThemeProvider>

					<ThemeProvider theme={ { colors: [ '#F9CA24', ...wooTheme.colors.slice( 1 ) ] } }>
						<BarListChart data={ barListData } width={ 350 } height={ 250 } withTooltips={ true } />
					</ThemeProvider>

					<ThemeProvider theme={ { colors: [ '#F0932B', ...wooTheme.colors.slice( 1 ) ] } }>
						<PieChart size={ 300 } data={ pieData } withTooltips={ true } showLegend={ true } />
					</ThemeProvider>

					<ThemeProvider theme={ { colors: [ '#EB4D4B', ...wooTheme.colors.slice( 1 ) ] } }>
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
};
