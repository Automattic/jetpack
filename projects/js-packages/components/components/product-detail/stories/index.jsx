/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetail from '..';

export default {
	title: 'JS Packages/Components/Product Detail',
	component: ProductDetail,
	decorators: [ withMock ],
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
};

const Template = args => <ProductDetail { ...args } />;

export const SecurityBundle = Template.bind( {} );
SecurityBundle.parameters = {};
SecurityBundle.args = {
	slug: 'security',
	name: 'Security',
	title: 'Security',
	description: 'Comprehensive site security, including Backup, Scan, and Anti-spam.',
	isBundle: true,
	isCard: true,
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
	addProductUrl: '',
	hasRequiredPlan: false,
	isLoading: false,
};

export const JetpackBackup = Template.bind( {} );
JetpackBackup.parameters = {};
JetpackBackup.args = {
	slug: 'backup',
	name: 'Backup',
	title: 'Jepack Backup',
	description:
		'Never lose a word, image, page, or time worrying about your site with automated backups & one-click restores.',
	features: [
		'Real-time cloud backups',
		'10GB of backup storage',
		'30-day archive & activity log',
		'One-click restores',
	],
	isBundle: false,
	isCard: true,
	pricing: {
		currency: 'USD',
		price: 9.66,
		offPrice: 3.95,
	},
	addProductUrl: '',
	hasRequiredPlan: false,
	isLoading: false,
};
