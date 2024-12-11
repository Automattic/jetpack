import { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../.';
import { LineChart, BarChart, PieSemiCircleChart } from '../../..';

const meta: Meta< typeof LineChart > = {
	title: 'JS Packages/Charts/Themes',
	component: ThemeProvider,
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj< typeof ThemeProvider >;

const sampleData = [
	{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
	{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
	{ date: new Date( '2024-01-03' ), value: 15, label: 'Jan 3' },
	{ date: new Date( '2024-01-04' ), value: 25, label: 'Jan 4' },
	{ date: new Date( '2024-01-05' ), value: 30, label: 'Jan 5' },
];

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

export const Default: Story = {
	render: () => (
		<ThemeProvider>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
			<BarChart data={ sampleData } width={ 600 } height={ 400 } />
			<PieSemiCircleChart
				data={ pieData }
				width={ 600 }
				height={ 400 }
				label="Pie Chart"
				note="Default Theme"
			/>
		</ThemeProvider>
	),
};

export const JetpackTheme: Story = {
	render: () => (
		<ThemeProvider theme={ jetpackTheme }>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
			<BarChart data={ sampleData } width={ 600 } height={ 400 } />
			<PieSemiCircleChart
				data={ pieData }
				width={ 600 }
				height={ 400 }
				label="Pie Chart"
				note="Jetpack Theme"
			/>
		</ThemeProvider>
	),
};

export const WooTheme: Story = {
	render: () => (
		<ThemeProvider theme={ wooTheme }>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
			<BarChart data={ sampleData } width={ 600 } height={ 400 } />
			<PieSemiCircleChart
				data={ pieData }
				width={ 600 }
				height={ 400 }
				label="Pie Chart"
				note="Woo Theme"
			/>
		</ThemeProvider>
	),
};

export const CustomColorTheme: Story = {
	render: () => (
		<ThemeProvider
			theme={ {
				colors: [ '#ff6b6b', '#ff9b9b', '#ffc6c6' ],
				gridStyles: {
					stroke: '#ffe3e3',
					strokeWidth: 2,
				},
			} }
		>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
			<BarChart data={ sampleData } width={ 600 } height={ 400 } />
			<PieSemiCircleChart
				data={ pieData }
				width={ 600 }
				height={ 400 }
				label="Pie Chart"
				note="Custom Color Theme"
			/>
		</ThemeProvider>
	),
};
