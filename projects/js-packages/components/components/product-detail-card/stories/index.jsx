/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetailCard from '../';

export default {
	title: 'JS Packages/Components/Product Detail Card',
	component: ProductDetailCard,
	decorators: [ withMock ],
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
};

const DefaultProductDetailCard = args => <ProductDetailCard { ...args } />;

export const Default = DefaultProductDetailCard.bind( {} );
Default.parameters = {};
Default.args = {
	slug: 'security',
	name: 'Security',
	title: 'Security',
	description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
	isBundle: true,
	supportedProducts: [ 'backup', 'scan', 'anti-spam' ],
	features: [
		'Real-time cloud backups with 10GB storage',
		'Automated real-time malware scan',
		'One-click fixes for most threats',
		'Comment & form spam protection',
	],
	pricing: {
		currency: 'USD',
		price: '24.92',
		offPrice: '12.42',
	},
	hasRequiredPlan: false,
	isLoading: false,
};
