/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ProductCardsSection from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Product Cards Section',
	component: ProductCardsSection,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
	},
};

const Template = args => <ProductCardsSection { ...args } />;

const DefaultArgs = {};
export const Default = Template.bind( {} );
Default.args = DefaultArgs;
