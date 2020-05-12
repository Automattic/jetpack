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
			imageBeforeUrl: imgExampleBefore,
			imageBeforeAlt: __( 'Before', 'jetpack' ),
			imageAfterId: '2',
			imageAfterUrl: imgExampleAfter,
			imageAfterAlt: __( 'After', 'jetpack' ),
			caption: __( 'Wonder Woman', 'jetpack' ),
		},
	},

	edit,
	save,
};
