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
	description: __( 'Add a subscription form for your Revue newsletter.', 'jetpack' ),
	icon,
	category: 'jetpack',
	supports: {
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
		firstNameField: {
			type: 'boolean',
			default: true,
		},
		lastNameField: {
			type: 'boolean',
			default: true,
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
