/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../index.jsx';

export default {
	title: 'Plugins/Protect/Product Offer',
	component: ConnectedProductOffer,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	argTypes: {
		isCard: {
			control: { type: 'boolean' },
		},
		showError: {
			control: { type: 'boolean' },
		},
	},
};

const DefaultDefaultProductOffer = args => {
	const error = args.showError
		? __( 'An error occurred. Please try again.', 'jetpack-protect' )
		: '';
	return <ConnectedProductOffer { ...args } error={ error } />;
};

export const Default = DefaultDefaultProductOffer.bind( {} );
Default.args = {
	isCard: false,
	showError: false,
};
