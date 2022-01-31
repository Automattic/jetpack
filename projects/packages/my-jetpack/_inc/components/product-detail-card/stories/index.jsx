/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProductDetailCard from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Product Detail Card',
	component: ProductDetailCard,
};

const Template = args => <ProductDetailCard { ...args } />;

const DefaultArgs = {
	name: __( 'Product Detail Card', 'jetpack-my-jetpack' ),
};

export const _default = Template.bind( {} );

_default.args = DefaultArgs;
