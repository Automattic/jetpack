/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectedButton from '../index.jsx';

export default {
	title: 'JS Packages/Connection/Connected Button',
	component: ConnectedButton,
};

const Template = args => <ConnectedButton { ...args } />;

export const Default = Template.bind( {} );
Default.args = {};
