/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductInterstitial, {
	BackupInterstitial,
	BoostInterstitial,
	SearchInterstitial,
	ScanInterstitial,
} from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Product Interstitial',
	component: ProductInterstitial,
	decorators: [ withMock ],
};

const DefaultArgs = {};

const DefaultBackupDetailCard = args => <BackupInterstitial { ...args } />;

export const _default = DefaultBackupDetailCard.bind( {} );
_default.parameters = {};
_default.args = DefaultArgs;

const BackupTemplate = args => <BackupInterstitial { ...args } />;
export const JetpackBackup = BackupTemplate.bind( {} );
JetpackBackup.parameters = {};

const BoostTemplate = args => <BoostInterstitial { ...args } />;
export const JetpackBoost = BoostTemplate.bind( {} );
JetpackBoost.parameters = {};

const ScanTemplate = args => <ScanInterstitial { ...args } />;
export const JetpackScan = ScanTemplate.bind( {} );
JetpackScan.parameters = {};

const SearchTemplate = args => <SearchInterstitial { ...args } />;
export const JetpackSearch = SearchTemplate.bind( {} );
JetpackSearch.parameters = {};
