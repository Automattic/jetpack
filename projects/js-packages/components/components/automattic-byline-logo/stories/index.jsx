/* eslint-disable react/react-in-jsx-scope */

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import AutomatticBylineLogo from '../index.jsx';

export default {
	title: 'Playground/Automattic Byline Logo',
	component: AutomatticBylineLogo,
};

const Template = args => <AutomatticBylineLogo { ...args } />;

const DefaultArgs = {
	title: 'Title',
	height: '50px',
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
