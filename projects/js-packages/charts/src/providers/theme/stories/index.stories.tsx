import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../.';
import { LineChart, BarChart, PieSemiCircleChart } from '../../../.';
import { sharedDecorator } from '../../../stories/decorator-config';
import { olympicMedals, temperatureData } from '../../../stories/sample-data';
import {
	themeArgTypes,
	defaultThemeArgs,
	getThemeByName,
	COLOR_PRESETS,
	buildCustomTheme,
} from '../../../stories/theme-config';

type StoryArgs = {
	theme?: string;
	customColors?: string[];
	containerWidth?: string;
	containerHeight?: string;
	resize?: 'both' | 'horizontal' | 'vertical' | 'none';
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Themes',
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

const sampleData = [ olympicMedals[ 0 ], olympicMedals[ 1 ], olympicMedals[ 2 ] ];

const lineSampleData = [ temperatureData[ 0 ], temperatureData[ 1 ] ];

const pieData = [
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 2,
	},
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 5,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 1,
	},
];

const GridComponent = ( { children } ) => {
	return (
		<div style={ { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' } }>
			{ children }
		</div>
	);
};

export const Default: Story = {
	render: () => (
		<ThemeProvider>
			<GridComponent>
				<LineChart
					data={ lineSampleData }
					width={ 400 }
					height={ 300 }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
				<BarChart data={ sampleData } width={ 400 } height={ 300 } />
				<PieSemiCircleChart data={ pieData } width={ 400 } label="Pie Chart" note="Default Theme" />
			</GridComponent>
		</ThemeProvider>
	),
};

export const JetpackTheme: Story = {
	render: () => (
		<ThemeProvider theme={ jetpackTheme }>
			<GridComponent>
				<LineChart
					data={ lineSampleData }
					width={ 400 }
					height={ 300 }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
				<BarChart data={ sampleData } width={ 400 } height={ 300 } />
				<PieSemiCircleChart data={ pieData } width={ 400 } label="Pie Chart" note="Jetpack Theme" />
			</GridComponent>
		</ThemeProvider>
	),
};

export const WooTheme: Story = {
	render: () => (
		<ThemeProvider theme={ wooTheme }>
			<GridComponent>
				<LineChart
					data={ lineSampleData }
					width={ 400 }
					height={ 300 }
					withGradientFill={ false }
					withLegendGlyph={ false }
				/>
				<BarChart data={ sampleData } width={ 400 } height={ 300 } />
				<PieSemiCircleChart data={ pieData } width={ 400 } label="Pie Chart" note="Woo Theme" />
			</GridComponent>
		</ThemeProvider>
	),
};

export const CustomTheme: Story = {
	args: {
		...defaultThemeArgs,
		customColors: COLOR_PRESETS.vibrant,
	},
	render: args => {
		const theme = args.customColors
			? buildCustomTheme( args.customColors )
			: getThemeByName( args.theme! );

		return (
			<ThemeProvider theme={ theme }>
				<GridComponent>
					<LineChart
						data={ lineSampleData }
						width={ 400 }
						height={ 300 }
						withGradientFill={ false }
						withLegendGlyph={ false }
					/>
					<BarChart data={ sampleData } width={ 400 } height={ 300 } />
					<PieSemiCircleChart
						data={ pieData }
						width={ 400 }
						label="Pie Chart"
						note="Interactive Custom Colors"
					/>
				</GridComponent>
			</ThemeProvider>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive custom color theme with real-time editing. Modify the customColors array in the controls to see immediate changes across all chart components.',
			},
		},
	},
};

export const ColorPresetShowcase: Story = {
	render: () => {
		const presetEntries = Object.entries( COLOR_PRESETS ).slice( 0, 4 ); // Show first 4 presets for brevity

		return (
			<div style={ { display: 'grid', gap: '2rem' } }>
				{ presetEntries.map( ( [ presetName, colors ] ) => (
					<div key={ presetName }>
						<h3 style={ { marginBottom: '0.5rem', textTransform: 'capitalize' } }>
							{ presetName } Color Preset
						</h3>
						<div style={ { display: 'flex', gap: '0.25rem', marginBottom: '1rem' } }>
							{ colors.map( ( color, index ) => (
								<div
									key={ index }
									style={ {
										width: '24px',
										height: '24px',
										backgroundColor: color,
										border: '1px solid #ddd',
										borderRadius: '3px',
									} }
									title={ color }
								/>
							) ) }
						</div>
						<ThemeProvider theme={ buildCustomTheme( colors ) }>
							<GridComponent>
								<LineChart
									data={ lineSampleData }
									width={ 350 }
									height={ 250 }
									withGradientFill={ false }
									withLegendGlyph={ false }
								/>
								<BarChart data={ sampleData } width={ 350 } height={ 250 } />
								<PieSemiCircleChart
									data={ pieData }
									width={ 350 }
									label="Example Chart"
									note={ `${ presetName } theme` }
								/>
							</GridComponent>
						</ThemeProvider>
					</div>
				) ) }
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Showcase of different color presets applied to chart components. Each preset demonstrates how different color palettes affect the visual appearance of charts.',
			},
		},
	},
};
