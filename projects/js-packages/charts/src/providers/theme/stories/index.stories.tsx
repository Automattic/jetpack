import { Meta, StoryObj } from '@storybook/react';
import { LineChart } from '../../..';
import { ThemeProvider } from '../theme-provider';

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
	{ date: new Date( '2024-01-01' ), value: 10 },
	{ date: new Date( '2024-01-02' ), value: 20 },
	{ date: new Date( '2024-01-03' ), value: 15 },
	{ date: new Date( '2024-01-04' ), value: 25 },
	{ date: new Date( '2024-01-05' ), value: 30 },
];

export const Default: Story = {
	render: () => (
		<ThemeProvider>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
		</ThemeProvider>
	),
};

export const JetpackTheme: Story = {
	render: () => (
		<ThemeProvider
			theme={ {
				backgroundColor: '#1a1a1a',
				colors: [ '#00ff00' ],
				gridStyles: {
					stroke: '#333',
					strokeWidth: 1,
				},
			} }
		>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
		</ThemeProvider>
	),
};

export const WooTheme: Story = {
	render: () => (
		<ThemeProvider
			theme={ {
				backgroundColor: '#1a1a1a',
				colors: [ '#00ff00' ],
				gridStyles: {
					stroke: '#333',
					strokeWidth: 1,
				},
			} }
		>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
		</ThemeProvider>
	),
};

export const CustomColorTheme: Story = {
	render: () => (
		<ThemeProvider
			theme={ {
				colors: [ '#ff6b6b' ],
				gridStyles: {
					stroke: '#ffe3e3',
					strokeWidth: 2,
				},
			} }
		>
			<LineChart data={ sampleData } width={ 600 } height={ 400 } />
		</ThemeProvider>
	),
};
