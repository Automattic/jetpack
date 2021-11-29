/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import IDCScreenVisual from '../visual';

export default {
	title: 'Identity Crisis/Admin Screen',
	component: IDCScreenVisual,
	parameters: {
		layout: 'centered',
	},
};

const Template = args => <IDCScreenVisual { ...args } />;

const DefaultArgs = {
	wpcomHomeUrl: 'https://site1.example.org',
	currentUrl: 'https://site2.example.org',
	redirectUri: '',
	isMigrated: false,
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const Migrated = Template.bind( {} );
Migrated.args = {
	...DefaultArgs,
	isMigrated: true,
};
