/**
 * Internal dependencies
 */
import Placeholder from '..';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Placeholder',
	component: Placeholder,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof Placeholder >;

const Template: ComponentStory< typeof Placeholder > = args => <Placeholder { ...args } />;

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
