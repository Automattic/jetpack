import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import edit from './edit';
import icon from './icon';
import imgExampleAfter from './img-example-after.png';
import imgExampleBefore from './img-example-before.png';
import save from './save';

export const name = 'image-compare';

export const settings = {
	title: __( 'Image Compare', 'jetpack' ),
	description: __(
		'Compare two images with a slider. Works best with images of the same size.',
		'jetpack'
	),

	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: getCategoryWithFallbacks( 'media', 'layout' ),
	keywords: [
		_x( 'juxtapose', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
		_x( 'side by side', 'block search term', 'jetpack' ),
		_x( 'slider', 'block search term', 'jetpack' ),
	],

	supports: {
		align: [ 'wide', 'full' ],
	},

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
