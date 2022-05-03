/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Alert, { ALERT_LEVELS, LEVEL_INFO } from '../index';

export default {
	title: 'JS Packages/Components/Alert',
	component: Alert,
	argTypes: {
		level: {
			control: {
				type: 'select',
				options: ALERT_LEVELS,
			},
		},
	},
};

const Template = args => <Alert { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	level: LEVEL_INFO,
	children: "Don't forget to check your email for the latest news.",
	showIcon: true,
};
