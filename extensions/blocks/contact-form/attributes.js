/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export default {
	subject: {
		type: 'string',
		default: __( 'A new message from your website', 'jetpack' ),
	},
	to: {
		type: 'string',
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
