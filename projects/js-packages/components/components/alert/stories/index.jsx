import React from 'react';
import Alert from '../index';

export default {
	title: 'JS Packages/Components/Alert',
	component: Alert,
	argTypes: {
		level: {
			control: {
				type: 'select',
				options: [ 'info', 'success', 'warning', 'error' ],
			},
		},
	},
};

const Template = args => <Alert { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	level: 'info',
	children: "Don't forget to check your email for the latest news.",
	showIcon: true,
};
