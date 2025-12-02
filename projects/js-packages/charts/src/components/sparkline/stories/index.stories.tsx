import { Sparkline } from '../';
import type { SparklineProps } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< SparklineProps > = {
	title: 'JS Packages/Charts/Types/Sparkline',
	component: Sparkline,
	parameters: {
		layout: 'padded',
	},
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
	},
};

export default meta;

type Story = StoryObj< typeof Sparkline >;

// Sample data
const defaultData = [ 10, 15, 12, 18, 22, 25, 23, 28 ];

/**
 * Basic sparkline with all controls available for customization
 */
export const Default: Story = {
	args: {
		data: defaultData,
		width: 120,
		height: 48,
		color: '#4CAF50',
	},
};

/**
 * Dashboard example showing sparklines in metric cards
 */
export const DashboardExample: Story = {
	render: () => {
		const metrics = [
			{
				label: 'Revenue',
				value: '$28k',
				data: [ 10, 15, 12, 18, 22, 25, 23, 28 ],
				color: '#4CAF50',
			},
			{
				label: 'Users',
				value: '1.2k',
				data: [ 80, 82, 85, 83, 87, 90, 88, 92 ],
				color: '#2196F3',
			},
			{
				label: 'Traffic',
				value: '856',
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
};

/**
 * Empty data renders empty container
 */
export const EmptyData: Story = {
	args: {
		data: [],
		width: 120,
		height: 48,
	},
};

/**
 * Negative values are supported
 */
export const NegativeValues: Story = {
	args: {
		data: [ -10, -5, 0, 5, 10, 5, 0, -5 ],
		color: '#E91E63',
		width: 120,
		height: 48,
	},
};
