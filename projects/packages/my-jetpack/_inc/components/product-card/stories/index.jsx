/* eslint-disable react/react-in-jsx-scope */

import { VideopressIcon } from '@automattic/jetpack-components';
import { arrowUp } from '@wordpress/icons';
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
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'var(--jp-white-off)' } ],
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '100vw', maxWidth: 400 } }>
				<Story />
			</div>
		),
	],
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
	name: 'VideoPress',
	description: 'Save every change',
	icon: <VideopressIcon />,
	status: PRODUCT_STATUSES.ACTIVE,
	admin: true,
	slug: 'videopress',
};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;

export const Absent = Template.bind( {} );
Absent.args = {
	...DefaultArgs,
	status: PRODUCT_STATUSES.ABSENT,
};

export const WithChildren = Template.bind( {} );
WithChildren.args = {
	...DefaultArgs,
	children: <div>Card Children</div>,
};

export const WithMenu = Template.bind( {} );
WithMenu.args = {
	...DefaultArgs,
	showMenu: true,
	menuItems: [
		{
			label: 'Upload',
			icon: arrowUp,
		},
	],
};
