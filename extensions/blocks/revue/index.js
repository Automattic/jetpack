/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';
import { supportsCollections } from '../../shared/block-category';

export const name = 'revue';

export const settings = {
	title: __( 'Revue', 'jetpack' ),
	description: __( 'Add a subscription form for your Revue newsletter.', 'jetpack' ),
	icon,
	category: supportsCollections() ? 'grow' : 'jetpack',
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'subscription', 'block search term', 'jetpack' ),
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'mailing list', 'block search term', 'jetpack' ),
	],
	supports: {
		html: false,
	},
	attributes,
	edit,
	save,
	example: {
		attributes: {
			revueUsername: 'example',
		},
	},
};
