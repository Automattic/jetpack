/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import JetpackFooter from '../index.jsx';

export default {
	title: 'JS Packages/Components/Jetpack Footer',
	component: JetpackFooter,
};

const Template = args => <JetpackFooter { ...args } />;

const DefaultArgs = {
	moduleName: 'The Module Name',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
