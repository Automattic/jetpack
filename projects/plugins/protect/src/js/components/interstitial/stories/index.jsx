/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Interstitial from '../index.jsx';

export default {
	title: 'Plugins/Protect/Interstitial',
	component: Interstitial,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
};

const InterstitialTemplate = args => <Interstitial { ...args } />;
export const Default = InterstitialTemplate.bind( {} );
Default.args = {
	isFetching: false,
};
