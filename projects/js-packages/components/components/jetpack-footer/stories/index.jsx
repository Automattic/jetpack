/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import JetpackFooter from '../index.jsx';

export default {
	title: 'Playground/Jetpack Footer',
	component: JetpackFooter,
};

const Template = args => <JetpackFooter { ...args } />;

const DefaultArgs = {
	moduleName: 'The Module Name',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
