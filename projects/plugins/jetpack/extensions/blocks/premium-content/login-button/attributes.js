import { __ } from '@wordpress/i18n';

export default {
	text: {
		type: 'string',
		source: 'html',
		selector: 'a',
		default: __( 'Log in', 'jetpack' ),
	},
	borderRadius: {
		type: 'number',
	},
	backgroundColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	gradient: {
		type: 'string',
	},
	style: {
		type: 'object',
	},
};
