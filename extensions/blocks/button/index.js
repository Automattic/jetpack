/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { supportsCollections } from '../../shared/block-category';

export const name = 'button';

export const settings = {
	title: __( 'Button', 'jetpack' ),
	icon,
	category: supportsCollections() ? 'grow' : 'jetpack',
	keywords: [],
	supports: {
		html: false,
	},
	attributes,
	edit,
	save,
};
