import { __ } from '@wordpress/i18n';
import { NOTICE_PRIORITY_HIGH } from '../constants';
import { Notice } from './types';

export const WELCOME_BANNER_NOTICE_IDS: string[] = [ 'site-connection-success-notice' ];

export const NOTICE_SITE_CONNECTED: Notice = {
	message: __( 'Your site has been successfully connected.', 'jetpack-my-jetpack' ),
	options: {
		id: 'site-connection-success-notice',
		level: 'success',
		actions: [],
		priority: NOTICE_PRIORITY_HIGH,
		hideCloseButton: false,
	},
};

export const NOTICE_SITE_CONNECTION_ERROR: Notice = {
	message: __( 'Site connection failed. Please try again.', 'jetpack-my-jetpack' ),
	options: {
		id: 'site-connection-error-notice',
		level: 'error',
		actions: [],
		priority: NOTICE_PRIORITY_HIGH,
		hideCloseButton: false,
	},
};
