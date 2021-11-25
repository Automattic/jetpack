/**
 * External dependencies
 */
import React from 'react';
import JetpackAdminPage from '../index.jsx';

export default {
	title: 'Playground/Admin Page',
	component: JetpackAdminPage,
};

// Export additional stories using pre-defined values
const Template = args => <JetpackAdminPage { ...args } />;

// Export Default story
export const _default = Template.bind( {} );
