import { Tooltip } from '../index';
import type { TooltipProps } from '../types';
import type { Meta } from '@storybook/react';

/**
 * Custom tooltip component example that shows a different layout
 * @param {object}               props      - Component properties
 * @param {TooltipProps['data']} props.data - The data to display in the tooltip
 * @return   {JSX.Element} Custom tooltip content component
 */
const CustomTooltipContent = ( { data } ) => (
	<div style={ { padding: '8px' } }>
		<strong style={ { display: 'block', marginBottom: '4px' } }>{ data.label }</strong>
		<div style={ { color: '#888' } }>Value: { data.value }</div>
	</div>
);

export default {
	title: 'JS Packages/Charts/Tooltip',
	component: Tooltip,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'A flexible tooltip component that can display data with custom styling and layout.',
			},
		},
	},
	argTypes: {
		data: {
			description: 'The data object containing label and value',
			control: 'object',
		},
		top: {
			description: 'Distance from top of container',
			control: { type: 'range', min: 0, max: 200 },
		},
		left: {
			description: 'Distance from left of container',
			control: { type: 'range', min: 0, max: 200 },
		},
		style: {
			description: 'Additional CSS styles to apply',
			control: 'object',
		},
	},
} satisfies Meta< typeof Tooltip >;

/**
 * Template with a visible container to better demonstrate positioning
 * @param {object} args - Story arguments
 * @return   {JSX.Element} Story template component
 */
const Template = args => (
	<div
		style={ {
			position: 'relative',
			padding: '2rem',
			border: '1px dashed #ccc',
			width: '300px',
			height: '200px',
			background: '#f5f5f5',
		} }
	>
		<div
			style={ {
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				color: '#666',
			} }
		>
			Tooltip Container
		</div>
		<Tooltip { ...args } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	top: 100,
	left: 100,
	data: {
		label: 'Monthly Sales',
		value: '$4,200',
	},
};
Default.parameters = {
	docs: {
		description: {
			story: 'Default tooltip implementation with basic styling.',
		},
	},
};

export const CustomComponent = Template.bind( {} );
CustomComponent.args = {
	...Default.args,
	component: CustomTooltipContent,
	data: {
		label: 'Q4 Performance',
		value: '+27%',
	},
	style: {
		backgroundColor: '#fff',
		color: '#333',
		boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
	},
};
CustomComponent.parameters = {
	docs: {
		description: {
			story: 'Example of a custom tooltip component with different styling and layout.',
		},
	},
};

export const StyledTooltip = Template.bind( {} );
StyledTooltip.args = {
	...Default.args,
	data: {
		label: 'Active Users',
		value: '1,234',
	},
	style: {
		backgroundColor: '#2c5282',
		color: '#fff',
		padding: '1rem',
		borderRadius: '8px',
		fontSize: '16px',
		fontWeight: 'bold',
	},
};
StyledTooltip.parameters = {
	docs: {
		description: {
			story: 'Tooltip with custom styling applied through the style prop.',
		},
	},
};
