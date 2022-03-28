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
		mt: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mr: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		mb: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		ml: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pt: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pr: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pb: {
			control: { type: 'select', options: SPACING_VALUES },
		},
		pl: {
			control: { type: 'select', options: SPACING_VALUES },
		},
	},
};

const Template = args => <Text { ...args }>{ args.variant ?? 'body' }</Text>;

export const Default = Template.bind( {} );

Default.args = {
	variant: 'headline-medium',
	mt: 0,
	mr: 0,
	mb: 0,
	ml: 0,
	pt: 0,
	pr: 0,
	pb: 0,
	pl: 0,
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
