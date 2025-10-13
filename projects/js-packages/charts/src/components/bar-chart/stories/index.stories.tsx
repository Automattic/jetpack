import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	legendArgTypes,
	medalCountsData,
	themeArgTypes,
} from '../../../stories';
import BarChart from '../bar-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof BarChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Bar Chart',
	component: BarChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...legendArgTypes,
		orientation: {
			control: { type: 'radio' },
			options: [ 'vertical', 'horizontal' ],
			description: 'Bar orientation',
			table: { category: 'Visual Style' },
		},
		gridVisibility: {
			control: { type: 'radio' },
			options: [ 'none', 'x', 'y', 'xy' ],
			description: 'Grid line visibility',
			table: { category: 'Visual Style' },
		},
		seriesCount: {
			control: { type: 'radio' },
			options: [ 'single', 'multiple', 'many' ],
			description: 'Number of data series',
			table: { category: 'Data' },
		},
		withPatterns: {
			control: 'boolean',
			description: 'Use patterns for bars',
			table: { category: 'Visual Style' },
		},
	},
} satisfies Meta< StoryArgs >;

export default meta;

type Story = StoryObj< StoryArgs >;

// Interactive configuration story
export const Configuration: Story = {
	render: args => {
		const seriesCount = args.seriesCount || 'multiple';
		const dataMap = {
			single: [ medalCountsData[ 0 ] ],
			multiple: [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ],
			many: medalCountsData.slice( 0, 15 ), // Show 15 series for "many" to make it visually distinct from multiple (3)
		};

		return <BarChart { ...args } data={ dataMap[ seriesCount ] } />;
	},
	args: {
		withTooltips: true,
		seriesCount: 'multiple',
		gridVisibility: 'x',
		maxWidth: 1200,
		aspectRatio: 0.5,
		resizeDebounceTime: 300,
		orientation: 'vertical',
		withPatterns: false,
	},
};

// Basic example
export const Default: Story = {
	args: {
		withTooltips: true,
		data: [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ],
		gridVisibility: 'x',
		maxWidth: 1200,
		aspectRatio: 0.5,
		resizeDebounceTime: 300,
		orientation: 'vertical',
	},
};

export const WithPatterns: Story = {
	args: {
		...Default.args,
		withPatterns: true,
		data: Default.args.data.map( country => {
			return {
				...country,
				data: country.data.filter( d => parseInt( d.label ) >= 2016 ),
			};
		} ),
	},
};

export const ErrorStates: StoryObj< typeof BarChart > = {
	render: () => (
		<div style={ { display: 'grid', gap: '20px' } }>
			<div>
				<h3>Empty Data</h3>
				<div style={ { width: '400px', height: '300px' } }>
					<BarChart data={ [] } />
				</div>
			</div>

			<div>
				<h3>Invalid Data</h3>
				<div style={ { width: '400px', height: '300px' } }>
					<BarChart
						data={ [
							{
								label: 'Invalid Series',
								data: [
									{ date: new Date( 'invalid' ), value: 10, label: 'Invalid Date' },
									{ date: new Date( '2024-01-02' ), value: null, label: 'Null Value' },
								],
								options: {},
							},
						] }
					/>
				</div>
			</div>
		</div>
	),
};

ErrorStates.parameters = {
	docs: {
		description: {
			story:
				'Examples of how the bar chart handles various error states including empty data and invalid data.',
		},
	},
};

// Story demonstrating composition API
export const WithCompositionLegend: StoryObj< typeof BarChart > = {
	render: args => (
		<div style={ { width: '800px' } }>
			<BarChart
				data={ args.data || [ medalCountsData[ 0 ], medalCountsData[ 1 ], medalCountsData[ 2 ] ] }
				withTooltips={ true }
				gridVisibility="x"
				maxWidth={ 1200 }
				aspectRatio={ 0.5 }
			>
				<BarChart.Legend
					orientation={ args.legendOrientation || 'horizontal' }
					alignment={ args.legendAlignment || 'center' }
					position={ args.legendPosition || 'bottom' }
					maxWidth={ args.legendMaxWidth }
					textOverflow={ args.legendTextOverflow || 'wrap' }
				/>
			</BarChart>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates using the composition API with `<BarChart.Legend />` as a child component. This provides the same functionality as the `showLegend` prop but allows for more flexible composition patterns.',
			},
		},
	},
};

const dataWithZeroValues = [
	{
		group: 'United States',
		label: 'United States',
		data: [
			{ label: '1896', value: 0 },
			{ label: '1900', value: 0 },
			{ label: '1904', value: 2 },
			{ label: '1908', value: 1 },
			{ label: '1912', value: 3 },
		],
	},
	{
		group: 'Great Britain',
		label: 'Great Britain',
		data: [
			{ label: '1896', value: 1 },
			{ label: '1900', value: 0 },
			{ label: '1904', value: 1 },
			{ label: '1908', value: 10 },
			{ label: '1912', value: 9 },
		],
	},
	{
		group: 'Japan',
		label: 'Japan',
		data: [
			{ label: '1896', value: 2 },
			{ label: '1900', value: 1 },
			{ label: '1904', value: 2 },
			{ label: '1908', value: 1 },
			{ label: '1912', value: 2 },
		],
	},
];
export const ZeroValueComparison: StoryObj< typeof BarChart > = {
	render: () => (
		<div style={ { display: 'grid', gap: '40px' } }>
			<div>
				<h3>Zero Value Display: Disabled (Default)</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Zero values are not visually displayed. Bars with zero values have no height.
				</p>
				<div style={ { width: '600px', height: '300px' } }>
					<BarChart
						data={ dataWithZeroValues }
						showZeroValues={ false }
						withTooltips={ true }
						gridVisibility="x"
					/>
				</div>
			</div>

			<div>
				<h3>Zero Value Display: Enabled</h3>
				<p style={ { marginBottom: '20px', color: '#666' } }>
					Zero values are visually displayed with minimum height bars. The tooltip still shows the
					actual value of 0, while the bar has a small visual height for better UX.
				</p>
				<div style={ { width: '600px', height: '300px' } }>
					<BarChart
						data={ dataWithZeroValues }
						showZeroValues={ true }
						withTooltips={ true }
						gridVisibility="x"
					/>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Comparison showing the difference between disabled and enabled zero value display modes. The feature preserves data integrity by keeping the original value for tooltips while providing visual feedback through minimum bar heights.',
			},
		},
	},
};
