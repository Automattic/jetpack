import { Sparkline } from '../';
import { chartDecorator, type ChartStoryArgs } from '../../../stories/chart-decorator';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof Sparkline > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Sparkline',
	component: Sparkline,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Array of numeric values to plot',
			table: { category: 'Data' },
		},
		width: {
			control: { type: 'number', min: 50, max: 400 },
			description: 'Width of the sparkline in pixels',
			table: { category: 'Dimensions' },
		},
		height: {
			control: { type: 'number', min: 20, max: 200 },
			description: 'Height of the sparkline in pixels',
			table: { category: 'Dimensions' },
		},
		color: {
			control: 'color',
			description: 'Color for the line stroke',
			table: { category: 'Visual Style' },
		},
		strokeWidth: {
			control: { type: 'number', min: 1, max: 5 },
			description: 'Line stroke width in pixels',
			table: { category: 'Visual Style' },
		},
		withGradientFill: {
			control: 'boolean',
			description: 'Whether to render gradient fill beneath the line',
			table: { category: 'Visual Style' },
		},
		gradient: {
			control: 'object',
			description: 'Gradient configuration',
			table: { category: 'Visual Style' },
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name',
			table: { category: 'Styling' },
		},
		margin: {
			control: 'object',
			description: 'Margin around the chart',
			table: { category: 'Dimensions' },
		},
		animation: {
			control: 'boolean',
			description: 'Enable entry animation on initial render',
			table: { category: 'Visual Style' },
		},
	},
};

export default meta;

type Story = StoryObj< StoryArgs >;

// Sample data
const defaultData = [ 10, 15, 12, 18, 22, 25, 23, 28 ];

/**
 * Basic sparkline with all controls available for customization.
 * Use the controls panel to experiment with colors, gradients, dimensions, and data.
 */
export const Default: Story = {
	args: {
		data: defaultData,
		width: 120,
		height: 48,
		color: '#4CAF50',
		containerHeight: '100px',
	},
};

/**
 * Responsive sparkline that fills the container.
 * Drag the corner of the container to resize and see the sparkline adapt.
 */
export const Responsive: Story = {
	args: {
		data: Default.args?.data,
		color: '#9C27B0',
	},
};

/**
 * Sparkline with an aspect ratio.
 */
export const AspectRatio: Story = {
	args: {
		data: Default.args?.data,
		color: '#9C27B0',
		aspectRatio: 0.3,
	},
};

/**
 * Empty data renders an empty container gracefully.
 */
export const EmptyData: Story = {
	args: {
		...Default.args,
		data: [],
	},
};

/**
 * Single data point renders as a circle instead of a line.
 */
export const SinglePoint: Story = {
	args: {
		...Default.args,
		data: [ 42 ],
		color: '#9C27B0',
	},
};

/**
 * Two data points render as a minimal line segment.
 */
export const TwoPoints: Story = {
	args: {
		...Default.args,
		data: [ 10, 20 ],
		color: '#3F51B5',
	},
};

/**
 * Dashboard example showing sparklines in metric cards - a common real-world use case.
 */
export const Dashboard: Story = {
	render: () => {
		const metrics = [
			{
				label: 'Speeding up',
				value: 28,
				data: [ 10, 15, 12, 18, 22, 25, 23, 28 ],
				color: '#4CAF50',
			},
			{
				label: 'Efficient',
				value: 90,
				data: [ 80, 82, 85, 83, 87, 90, 88, 92 ],
				color: '#2196F3',
			},
			{
				label: 'Unstable',
				value: 65,
				data: [ 50, 75, 45, 80, 40, 85, 55, 65 ],
				color: '#FF9800',
			},
		];

		return (
			<div style={ { display: 'flex', gap: '24px', flexWrap: 'wrap' } }>
				{ metrics.map( metric => (
					<div
						key={ metric.label }
						style={ {
							padding: '16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							minWidth: '200px',
						} }
					>
						<div
							style={ {
								display: 'flex',
								justifyContent: 'space-between',
								marginBottom: '8px',
							} }
						>
							<span style={ { fontSize: '14px', color: '#666' } }>{ metric.label }</span>
							<span style={ { fontSize: '18px', fontWeight: 'bold' } }>{ metric.value }</span>
						</div>
						<Sparkline data={ metric.data } width={ 180 } height={ 48 } color={ metric.color } />
					</div>
				) ) }
			</div>
		);
	},
	args: {
		containerHeight: '150px',
	},
};

/**
 * Sparkline with entry animation that creates a smooth rising effect.
 * The animation respects the user's prefers-reduced-motion setting for accessibility.
 */
export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};
