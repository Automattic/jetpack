/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetailCard, {
	BackupDetailCard,
	BoostDetailCard,
	BackupDetail,
	BoostDetail,
} from '../index.jsx';
import { backupProductData, boostProductData } from './mock-data.js';

export default {
	title: 'Packages/My Jetpack/Product Detail Card',
	component: ProductDetailCard,
	decorators: [ withMock ],
};

const DefaultArgs = {};

const DefaultBackupDetailCard = args => <BackupDetailCard { ...args } />;

export const _default = DefaultBackupDetailCard.bind( {} );
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

const BackupTemplate = args => <BackupDetail { ...args } />;
export const JetpackBackup = BackupTemplate.bind( {} );
JetpackBackup.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/products/backup?_locale=user',
			method: 'GET',
			status: 200,
			response: backupProductData,
		},
	],
};

const BoostTemplate = args => <BoostDetail { ...args } />;
export const JetpackBoost = BoostTemplate.bind( {} );
JetpackBoost.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/products/boost?_locale=user',
			method: 'GET',
			status: 200,
			response: boostProductData,
		},
	],
};

const BackupTemplateCard = args => <BackupDetailCard { ...args } />;
export const JetpackBackupCard = BackupTemplateCard.bind( {} );
JetpackBackupCard.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/products/backup?_locale=user',
			method: 'GET',
			status: 200,
			response: backupProductData,
		},
	],
};

const BoostTemplateCard = args => <BoostDetailCard { ...args } />;
export const JetpackBoostCard = BoostTemplateCard.bind( {} );
JetpackBoostCard.parameters = {
	mockData: [
		{
			url: 'my-jetpack/v1/site/products/boost?_locale=user',
			method: 'GET',
			status: 200,
			response: boostProductData,
		},
	],
};
