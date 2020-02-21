/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'revue';

export const title = __( 'Revue', 'jetpack' );

export const settings = {
	title,
	description: __( 'Add a Revue signup form.', 'jetpack' ),
	icon,
	category: 'jetpack',
	support: {
		html: false,
	},
	attributes: {
		revueUsername: {
			type: 'string',
		},
		text: {
			type: 'string',
			default: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		customTextColor: {
			type: 'string',
		},
		borderRadius: {
			type: 'number',
		},
		gradient: {
			type: 'string',
		},
		customGradient: {
			type: 'string',
		},
	},
	edit,
	save: () => {},
};
