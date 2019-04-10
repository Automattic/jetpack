/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import transforms from './transforms';
import { default as icon } from './icons';

const blockAttributes = {
	logoSize: {
		type: 'string',
		default: 'medium',
	},
	ids: {
		default: [],
		type: 'array',
	},
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: 'ul.wp-block-jetpack-logo-gallery .logo-gallery-item',
		query: {
			url: {
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
			},
			link: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-link',
			},
			alt: {
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
			},
			id: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-id',
			},
		},
	},
};

export const name = 'logo-gallery';

export const settings = {
	title: __( 'Logo Gallery', 'jetpack' ),
	category: 'jetpack',
	keywords: [ __( 'logo', 'jetpack' ), __( 'gallery', 'jetpack' ), __( 'image', 'jetpack' ) ],
	description: __( 'Display multiple logos in a row.', 'jetpack' ),
	attributes: blockAttributes,
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	icon,
	edit,
	save,
	transforms,
};
