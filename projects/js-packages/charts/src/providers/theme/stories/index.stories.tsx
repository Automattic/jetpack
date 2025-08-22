import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../.';
import { LineChart, BarChart, PieSemiCircleChart } from '../../../.';
import { sharedDecorator } from '../../../stories/decorator-config';
import { olympicMedals, temperatureData } from '../../../stories/sample-data';
import { themeArgTypes, defaultThemeArgs, buildCustomTheme } from '../../../stories/theme-config';

type StoryArgs = {
	theme?: string;
	customColors?: string[];
	color1?: string;
	color2?: string;
	color3?: string;
	color4?: string;
	color5?: string;
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
	parameters: {
		controls: {
			exclude: [ 'color1', 'color2', 'color3', 'color4', 'color5', 'customColors' ],
		},
	},
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
	parameters: {
		controls: {
			exclude: [ 'color1', 'color2', 'color3', 'color4', 'color5', 'customColors' ],
		},
	},
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
	parameters: {
		controls: {
			exclude: [ 'color1', 'color2', 'color3', 'color4', 'color5', 'customColors' ],
		},
	},
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
			<ThemeProvider key={ themeKey } theme={ theme }>
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
					'Interactive custom color theme with individual color picker controls. Use the color pickers in the controls panel to see immediate changes across all chart components.',
			},
		},
	},
};
