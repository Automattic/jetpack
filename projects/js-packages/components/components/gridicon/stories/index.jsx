/**
 * External dependencies
 */
import React from 'react';
import Gridicon from '../index.jsx';

export default {
	title: 'JS Packages/Components/Gridicon',
	component: Gridicon,
};

// Export additional stories using pre-defined values
const Template = args => <Gridicon { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const InfoOutline = Template.bind( {} );
InfoOutline.args = {
	icon: 'info-outline',
};
