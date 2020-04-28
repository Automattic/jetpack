/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import save from './save';

export const name = 'image-compare';

export const settings = {
	title: __( 'Image Compare', 'jetpack' ),
	description: __( 'Compare two images with a slider.', 'jetpack' ),

	icon,

	category: 'layout',

	attributes: {
		imageBeforeId: {
			type: 'string',
			source: 'attribute',
			attribute: 'id',
			selector: '.image-compare__image-before',
		},
		imageBeforeUrl: {
			type: 'string',
			source: 'attribute',
			attribute: 'src',
			selector: '.image-compare__image-before',
		},
		imageBeforeAlt: {
			type: 'string',
			source: 'attribute',
			attribute: 'alt',
			selector: '.image-compare__image-before',
		},
		imageAfterId: {
			type: 'string',
			source: 'attribute',
			attribute: 'id',
			selector: '.image-compare__image-after',
		},
		imageAfterUrl: {
			type: 'string',
			source: 'attribute',
			attribute: 'src',
			selector: '.image-compare__image-after',
		},
		imageAfterAlt: {
			type: 'string',
			source: 'attribute',
			attribute: 'alt',
			selector: '.image-compare__image-after',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
		},
		orientation: {
			type: 'string',
		},
	},

	example: {
		attributes: {
			imageBeforeId: '1',
			imageBeforeUrl:
				'https://upload.wikimedia.org/wikipedia/commons/archive/d/d8/20180325051241%21Lynda_Carter_Wonder_Woman.JPG',
			imageBeforeAlt: __( 'Before', 'jetpack' ),
			imageAfterId: '2',
			imageAfterUrl:
				'https://upload.wikimedia.org/wikipedia/commons/d/d8/Lynda_Carter_Wonder_Woman.JPG',
			imageAfterAlt: __( 'After', 'jetpack' ),
			caption: __( 'Wonder Woman', 'jetpack' ),
		},
	},

	edit,
	save,
};
