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

const mapResponse = {
	backup: backupProductData,
	boost: boostProductData,
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

export const _default = DefaultBackupDetailCard.bind( {} );
_default.parameters = {
	mockData: getMockData( 'backup' ),
};
_default.args = DefaultArgs;

const BackupTemplate = args => <BackupDetail { ...args } />;
export const JetpackBackup = BackupTemplate.bind( {} );
JetpackBackup.parameters = {
	mockData: getMockData( 'backup' ),
};

const BoostTemplate = args => <BoostDetail { ...args } />;
export const JetpackBoost = BoostTemplate.bind( {} );
JetpackBoost.parameters = {
	mockData: getMockData( 'boost' ),
};

const BackupTemplateCard = args => <BackupDetailCard { ...args } />;
export const CardJetpackBackup = BackupTemplateCard.bind( {} );
CardJetpackBackup.parameters = {
	mockData: getMockData( 'backup' ),
};

const BoostTemplateCard = args => <BoostDetailCard { ...args } />;
export const CardJetpackBoost = BoostTemplateCard.bind( {} );
CardJetpackBoost.parameters = {
	mockData: getMockData( 'boost' ),
};
