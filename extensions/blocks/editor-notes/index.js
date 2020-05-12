/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Style dependencies
 */
import './editor.scss';
import { supportsCollections } from '../../shared/block-category';

export const name = 'editor-notes';
export const title = __( 'Editor Notes', 'jetpack' );
export const settings = {
	title,
	description: __( 'Insert a note visible only by other editors.', 'jetpack' ),
	icon: 'hidden',
	category: supportsCollections() ? 'embed' : 'jetpack',
	keywords: [],
	supports: {
		align: true,
		html: false,
	},
	edit,
	save: () => null,
	attributes: {
		notes: {
			type: 'array',
			source: 'meta',
			meta: 'jetpack-editor-notes',
		},
		noteId: {
			type: 'number',
			required: true,
		},
	},
	example: {
		attributes: {},
	},
};
