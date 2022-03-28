/* eslint-disable react/react-in-jsx-scope */

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../index.jsx';
import { initStore } from '../../../state/store';
import { BackupIcon } from '@automattic/jetpack-components';

// Set myJetpackRest global var.
window.myJetpackRest = {};

initStore();

export default {
	title: 'Packages/My Jetpack/Product Card',
	component: ProductCard,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'var(--jp-white-off)' } ],
		},
	},
	argTypes: {
		icon: {
			table: {
				disable: true,
			},
		},
	},
};

const Template = args => <ProductCard { ...args } />;

const DefaultArgs = {
	name: 'Backup',
	description: 'Save every change',
	icon: <BackupIcon />,
	status: PRODUCT_STATUSES.ACTIVE,
	admin: true,
	slug: 'backup',
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;
