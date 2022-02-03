/**
 * External dependencies
 */
import React from 'react';
import AdminPage from '../index.jsx';

export default {
	title: 'JS Packages/Components/Admin Page',
	component: AdminPage,
};

// Export additional stories using pre-defined values
const Template = args => <AdminPage { ...args } />;

// Export Default story
export const _default = Template.bind( {} );
