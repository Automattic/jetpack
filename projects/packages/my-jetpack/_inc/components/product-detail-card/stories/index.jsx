/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetailCard, { ProductDetail } from '../index.jsx';
import { backupProductData, boostProductData, scanProductData } from './mock-data.js';

export default {
	title: 'Packages/My Jetpack/Product Detail Card',
	component: ProductDetailCard,
	decorators: [ withMock ],
};

const DefaultArgs = {};

const DefaultProductDetailCard = args => <ProductDetailCard { ...args } slug="backup" />;

const mapResponse = {
	backup: backupProductData,
	boost: boostProductData,
	scan: scanProductData,
};

/**
 * Helper function that returns the story mock data.
 *
 * @param {string} product - Product slug
 * @returns {Array}          Story mock data
 */
function getMockData( product ) {
	return [
		{
			url: `my-jetpack/v1/site/products/${ product }?_locale=user`,
			method: 'GET',
			status: 200,
			response: mapResponse[ product ],
		},
	];
}

export const _default = DefaultProductDetailCard.bind( {} );
_default.parameters = {
	mockData: getMockData( 'backup' ),
};
_default.args = DefaultArgs;

const BackupTemplate = args => <ProductDetail { ...args } slug="backup" />;
export const JetpackBackup = BackupTemplate.bind( {} );
JetpackBackup.parameters = {
	mockData: getMockData( 'backup' ),
};

const BoostTemplate = args => <ProductDetail { ...args } slug="boost" />;
export const jetpackBoost = BoostTemplate.bind( {} );
jetpackBoost.parameters = {
	mockData: getMockData( 'boost' ),
};

const BackupCardTemplate = args => <ProductDetailCard { ...args } slug="backup" />;
export const JetpackBackupCard = BackupCardTemplate.bind( {} );
JetpackBackupCard.parameters = {
	mockData: getMockData( 'backup' ),
};

const BoostCardTemplate = args => <ProductDetailCard { ...args } slug="boost" />;
export const JetpackBoostCard = BoostCardTemplate.bind( {} );
JetpackBoostCard.parameters = {
	mockData: getMockData( 'boost' ),
};

const ScanCardTemplate = args => <ProductDetailCard { ...args } slug="scan" />;
export const JetpackScanCard = ScanCardTemplate.bind( {} );
JetpackScanCard.parameters = {
	mockData: getMockData( 'scan' ),
};
