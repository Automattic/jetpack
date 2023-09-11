import React from 'react';
import ProductDetailButton from '../';

export default {
	title: 'Packages/My Jetpack/Product Detail Button',
	component: ProductDetailButton,
};

const DetaiilButton = args => <ProductDetailButton { ...args } slug="backup" />;

export const Default = DetaiilButton.bind( {} );
Default.args = {
	children: 'Add Jetpack Search',
};
