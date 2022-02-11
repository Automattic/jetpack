/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetail from '../index.jsx';
import { getMockData } from './utils.js';

export default {
	title: 'Packages/My Jetpack/Product Detail',
	component: ProductDetail,
	decorators: [ withMock ],
};

const DefaultArgs = {};

const DefaultProductDetail = args => <ProductDetail { ...args } slug="backup" />;

export const _default = DefaultProductDetail.bind( {} );
_default.parameters = {
	mockData: getMockData( 'backup' ),
};
_default.args = DefaultArgs;

const AntiSpamTemplate = args => <ProductDetail { ...args } slug="anti-spam" />;
export const JetpackAntiSpam = AntiSpamTemplate.bind( {} );
JetpackAntiSpam.parameters = {
	mockData: getMockData( 'anti-spam' ),
};

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
