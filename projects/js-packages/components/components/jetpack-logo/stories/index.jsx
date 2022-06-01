/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import JetpackLogo from '../index.jsx';

export default {
	title: 'JS Packages/Components/Jetpack Logo',
	component: JetpackLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

const Template = args => <JetpackLogo { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
