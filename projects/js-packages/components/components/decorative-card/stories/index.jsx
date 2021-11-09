/**
 * External dependencies
 */
import React from 'react';
import DecorativeCard from '../index.jsx';

export default {
	title: 'Playground/Decorative Card',
	component: DecorativeCard,
};

// Export additional stories using pre-defined values
const Template = args => <DecorativeCard { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const Unlink = Template.bind( {} );
Unlink.args = {
	icon: 'unlink',
};
