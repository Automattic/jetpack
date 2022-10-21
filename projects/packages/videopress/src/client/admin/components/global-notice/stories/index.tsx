/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import React from 'react';
import GlobalNotice from '..';

export default {
	title: 'Packages/VideoPress/GlobalNotice',
	component: GlobalNotice,
	argTypes: {
		status: {
			control: {
				type: 'select',
				options: [ 'success', 'info', 'warning', 'error' ],
			},
		},
	},
};

const Template = args => <GlobalNotice { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	children: 'Typical error message',
	addConnectUserLink: true,
	isDismissible: true,
	status: 'error',

	onRemove: action( 'onRemove' ),
	onConnectUserClick: action( 'onConnectUserClick' ),
};
