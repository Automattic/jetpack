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
	argTypes: {
		color: { control: 'color' },
	},
};

const Template = args => <Spinner { ...args } />;

export const _default = Template.bind( {} );
