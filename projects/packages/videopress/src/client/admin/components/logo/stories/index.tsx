import React from 'react';
import Logo from '..';

export default {
	title: 'Packages/VideoPress/Logo',
	component: Logo,
	argTypes: {
		iconColor: {
			control: {
				type: 'color',
			},
		},
		color: {
			control: {
				type: 'color',
			},
		},
	},
};

const Template = args => <Logo { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	iconColor: '#069E08',
	color: '#000',
};
