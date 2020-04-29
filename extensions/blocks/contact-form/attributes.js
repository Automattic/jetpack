/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export const defaultAttributes = {
	subject: {
		type: 'string',
		default: __( 'A new message from your website', 'jetpack' ),
	},
	to: {
		type: 'string',
	},
	hasFormSettingsSet: {
		type: 'string',
		default: null,
	},
	customThankyou: {
		type: 'string',
		default: '',
	},
	customThankyouMessage: {
		type: 'string',
		default: '',
	},
	customThankyouRedirect: {
		type: 'string',
		default: '',
	},
};
