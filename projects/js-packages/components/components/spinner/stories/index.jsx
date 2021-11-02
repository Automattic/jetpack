/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Spinner from '../index.jsx';

export default {
	title: 'Playground/Spinner',
	component: Spinner,
};

const Template = args => <Spinner { ...args } />;

const DefaultArgs = {
	moduleName: 'The Module Name',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
