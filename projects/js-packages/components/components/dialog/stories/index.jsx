/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ProductDetailCard from '../../product-detail-card';
import Dialog from '../';
import BoostImage from '../boost.png';

export default {
	title: 'JS Packages/Components/Dialog',
	component: Dialog,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
};

const Template = args => <Dialog { ...args } />;

export const InterstitialJetpackBoost = Template.bind( {} );
InterstitialJetpackBoost.parameters = {};
InterstitialJetpackBoost.args = {
	primary: (
		<ProductDetailCard
			slug="boost"
			name="Boost"
			title="Jepack Boost"
			description="Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required."
			features={ [
				'Check your site performance',
				'Enable improvements in one click',
				'Standalone free plugin for those focused on speed',
			] }
			pricing={ {
				isFree: true,
			} }
		/>
	),
	secondary: <img src={ BoostImage } alt="Boost" />,
};
