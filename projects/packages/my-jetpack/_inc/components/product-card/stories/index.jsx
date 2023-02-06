/* eslint-disable react/react-in-jsx-scope */

import { BackupIcon } from '@automattic/jetpack-components';
import React from 'react';
import { initStore } from '../../../state/store';
import ProductCard, { PRODUCT_STATUSES } from '../index.jsx';

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

export const Absent = Template.bind( {} );
Absent.args = {
	...DefaultArgs,
	status: PRODUCT_STATUSES.ABSENT,
};
