/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Text, { SPACING_VALUES } from '../index.jsx';

export default {
	title: 'JS Packages/Components/Text',
	component: Text,
	argTypes: {
		top: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		right: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		bottom: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		left: {
			control: { type: 'select', options: SPACING_VALUES },
		},
	},
};

const Template = args => <Text { ...args }>{ args.variant ?? 'body' }</Text>;

export const Default = Template.bind( {} );

Default.args = {
	variant: 'headline-medium',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
};

export const CustomTag = Template.bind( {} );

CustomTag.args = {
	variant: 'title-small',
	component: 'div',
};

const Custom = ( { className, children } ) => (
	<span className={ className }>{ children } Composition</span>
);

export const CustomComponent = Template.bind( {} );

CustomComponent.args = {
	variant: 'headline-small',
	component: Custom,
};
