/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Alert, { LEVEL_INFO } from '../index.jsx';

export default {
	title: 'JS Packages/Components/Alert',
	component: Alert,
};

const Template = args => <Alert { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	level: LEVEL_INFO,
	children: "Don't forget to check your email for the latest news.",
	showIcon: true,
};
