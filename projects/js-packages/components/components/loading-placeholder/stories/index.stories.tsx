/**
 * Internal dependencies
 */
import LoadingPlaceholder from '..';
/**
 * Types
 */
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Loading Placeholder',
	component: LoadingPlaceholder,
	parameters: {
		layout: 'centered',
	},
} as Meta< typeof LoadingPlaceholder >;

const Template: StoryFn< typeof LoadingPlaceholder > = args => <LoadingPlaceholder { ...args } />;

export const Fluid = Template.bind( {} );
Fluid.decorators = [
	Story => (
		<div
			style={ {
				width: '200px',
				height: '300px',
			} }
		>
			<Story />
		</div>
	),
];

Fluid.argTypes = {
	width: {
		table: {
			disable: true,
		},
	},
	height: {
		table: {
			disable: true,
		},
	},
};

Fluid.args = {
	width: null,
	height: null,
};

export const Fixed = Template.bind( {} );

Fixed.args = {
	width: 200,
	height: 300,
};

Fixed.argTypes = {
	width: {
		control: {
			type: 'range',
			min: 0,
			max: 500,
			step: 1,
		},
	},
	height: {
		control: {
			type: 'range',
			min: 0,
			max: 500,
			step: 1,
		},
	},
};
