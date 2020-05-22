/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import icon from './icon';
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';
import { supportsCollections } from '../../shared/block-category';

export const name = 'amazon';
export const title = __( 'Amazon', 'jetpack' );
export const settings = {
	attributes,
	title,
	description: __( 'Promote Amazon products and earn a commission from sales.', 'jetpack' ),
	icon,
	category: supportsCollections() ? 'earn' : 'jetpack',
	keywords: [ __( 'amazon', 'jetpack' ), __( 'affiliate', 'jetpack' ) ],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save: () => null, // TODO - add Amazon links
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
