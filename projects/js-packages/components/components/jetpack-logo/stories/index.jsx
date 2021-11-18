/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import JetpackLogo from '../index.jsx';

export default {
	title: 'Playground/Jetpack Logo',
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
