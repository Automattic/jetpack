/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import save from './save';
import imgExampleAfter from './img-example-after.png';
import imgExampleBefore from './img-example-before.png';
import { supportsCollections } from '../../shared/block-category';

export const name = 'image-compare';

export const settings = {
	title: __( 'Image Compare', 'jetpack' ),
	description: __( 'Compare two images with a slider.', 'jetpack' ),

	icon,

	category: supportsCollections() ? 'layout' : 'jetpack',
	keywords: [
		_x( 'juxtapose', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
		_x( 'side by side', 'block search term', 'jetpack' ),
		_x( 'slider', 'block search term', 'jetpack' ),
	],

	attributes: {
		imageBefore: {
			type: 'object',
			default: {},
		},
		imageAfter: {
			type: 'object',
			default: {},
		},
		caption: {
			type: 'string',
		},
		orientation: {
			type: 'string',
			default: 'horizontal',
		},
	},

	example: {
		attributes: {
			imageBefore: {
				id: 1,
				url: imgExampleBefore,
				alt: __( 'Before', 'jetpack' ),
			},
			imageAfter: {
				id: 2,
				url: imgExampleAfter,
				alt: __( 'After', 'jetpack' ),
			},
			caption: __( 'Example image', 'jetpack' ),
		},
	},

	edit,
	save,
};
