/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetailCard, { BackupDetailCard } from '../index.jsx';
import { backupProductData } from './mock-data.js';

export default {
	title: 'Packages/My Jetpack/Backup Detail Card',
	component: ProductDetailCard,
	decorators: [ withMock ],
};

const Template = args => <BackupDetailCard { ...args } />;

const DefaultArgs = {};

export const _default = Template.bind( {} );

_default.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/products/backup?_locale=user',
			method: 'GET',
			status: 200,
			response: backupProductData,
		},
	],
};

_default.args = DefaultArgs;
