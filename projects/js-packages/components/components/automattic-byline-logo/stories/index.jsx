/* eslint-disable react/react-in-jsx-scope */

import React from 'react';
import AutomatticBylineLogo from '../index.jsx';

export default {
	title: 'JS Packages/Components/Automattic Byline Logo',
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
