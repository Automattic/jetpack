import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../.';
import { LineChart, BarChart, PieSemiCircleChart } from '../../../.';
import { sharedDecorator } from '../../../stories/decorator-config';
import { olympicMedals, temperatureData } from '../../../stories/sample-data';
import {
	themeArgTypes,
	defaultThemeArgs,
	getThemeByName,
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
		customColors: [ '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57' ],
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
