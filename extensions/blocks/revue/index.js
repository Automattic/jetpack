/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

export const name = 'revue';

export const settings = {
	title: __( 'Revue', 'jetpack' ),
	description: __( 'Add a subscription form for your Revue newsletter.', 'jetpack' ),
	icon,
	category: 'jetpack',
	supports: {
		html: false,
	},
	attributes,
	edit,
	save: () => {},
};
