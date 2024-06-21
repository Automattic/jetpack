import { __ } from '@wordpress/i18n';
import { NOTICE_PRIORITY_HIGH } from '../constants';
import { Notice } from './types';

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
