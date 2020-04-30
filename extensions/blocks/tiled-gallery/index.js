/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { filter } from 'lodash';
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import {
	LAYOUT_CIRCLE,
	LAYOUT_COLUMN,
	LAYOUT_DEFAULT,
	LAYOUT_SQUARE,
	LAYOUT_STYLES,
} from './constants';
import { isSimpleSite } from '../../shared/site-type-utils';

/**
 * Style dependencies
 */
import './editor.scss';

import * as deprecatedV1 from './deprecated/v1';

/**
 * Example Images
 */
import tiledGalleryExample1 from './tiled-gallery_example-1.jpg';
import tiledGalleryExample2 from './tiled-gallery_example-2.jpg';
import tiledGalleryExample3 from './tiled-gallery_example-3.jpg';
import tiledGalleryExample4 from './tiled-gallery_example-4.jpg';
import tiledGalleryExample5 from './tiled-gallery_example-5.jpg';
import tiledGalleryExample6 from './tiled-gallery_example-6.jpg';
import { supportsCollections } from '../../shared/block-category';

// Style names are translated. Avoid introducing an i18n dependency elsewhere (view)
// by only including the labels here, the only place they're needed.
//
// Map style names to labels and merge them together.
const styleNames = {
	[ LAYOUT_DEFAULT ]: _x( 'Tiled mosaic', 'Tiled gallery layout', 'jetpack' ),
	[ LAYOUT_CIRCLE ]: _x( 'Circles', 'Tiled gallery layout', 'jetpack' ),
	[ LAYOUT_COLUMN ]: _x( 'Tiled columns', 'Tiled gallery layout', 'jetpack' ),
	[ LAYOUT_SQUARE ]: _x( 'Square tiles', 'Tiled gallery layout', 'jetpack' ),
};
const layoutStylesWithLabels = LAYOUT_STYLES.map( style => ( {
	...style,
	label: styleNames[ style.name ],
} ) );

/**
 * Filter valid images
 *
 * @param {array} images Array of image objects
 * @return {array} Array of image objects which have id and url
 */
function getValidImages( images ) {
	return filter( images, ( { id, url } ) => id && url );
}

const blockAttributes = {
	// Set default align
	align: {
		default: 'center',
		type: 'string',
	},
	// Set default className (used with block styles)
	className: {
		default: `is-style-${ LAYOUT_DEFAULT }`,
		type: 'string',
	},
	columns: {
		type: 'number',
	},
	ids: {
		default: [],
		type: 'array',
	},
	imageFilter: {
		type: 'string',
	},
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: '.tiled-gallery__item',
		query: {
			alt: {
				attribute: 'alt',
				default: '',
				selector: 'img',
				source: 'attribute',
			},
			height: {
				attribute: 'data-height',
				selector: 'img',
				source: 'attribute',
				type: 'number',
			},
			id: {
				attribute: 'data-id',
				selector: 'img',
				source: 'attribute',
			},
			link: {
				attribute: 'data-link',
				selector: 'img',
				source: 'attribute',
			},
			url: {
				attribute: 'data-url',
				selector: 'img',
				source: 'attribute',
			},
			width: {
				attribute: 'data-width',
				selector: 'img',
				source: 'attribute',
				type: 'number',
			},
		},
	},
	linkTo: {
		default: 'none',
		type: 'string',
	},
	roundedCorners: {
		type: 'integer',
		default: 0,
	},
};

const exampleAttributes = {
	align: 'center',
	className: 'is-style-rectangular',
	images: [
		{
			alt: '',
			link: '',
			url: tiledGalleryExample1,
			width: 160,
			height: 95,
		},
		{
			alt: '',
			link: '',
			url: tiledGalleryExample2,
			width: 160,
			height: 107,
		},
		{
			alt: '',
			link: '',
			url: tiledGalleryExample3,
			width: 304,
			height: 203,
		},
		{
			alt: '',
			link: '',
			url: tiledGalleryExample4,
			width: 312,
			height: 207,
		},
		{
			alt: '',
			link: '',
			url: tiledGalleryExample5,
			width: 152,
			height: 101,
		},
		{
			alt: '',
			link: '',
			url: tiledGalleryExample6,
			width: 152,
			height: 105,
		},
	],
	linkTo: 'none',
};

export const name = 'tiled-gallery';

export const icon = (
	<SVG viewBox="0 0 24 24" width={ 24 } height={ 24 }>
		<Path
			fill="currentColor"
			d="M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z"
		/>
	</SVG>
);

export const settings = {
	attributes: blockAttributes,
	category: supportsCollections() ? 'layout' : 'jetpack',
	description:
		__( 'Display multiple images in an elegantly organized tiled layout.', 'jetpack' ) +
		( ! isSimpleSite()
			? ' ' + __( "Serves images using Jetpack's fast global network of servers.", 'jetpack' )
			: '' ),
	icon,
	keywords: [
		_x( 'columns', 'block search term', 'jetpack' ),
		_x( 'images', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
		_x( 'square', 'block search term', 'jetpack' ),
		_x( 'circle', 'block search term', 'jetpack' ),
		_x( 'mosaic', 'block search term', 'jetpack' ),
	],
	styles: layoutStylesWithLabels,
	supports: {
		align: [ 'center', 'wide', 'full' ],
		customClassName: false,
		html: false,
	},
	title: __( 'Tiled Gallery', 'jetpack' ),
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/image' ],
				isMatch: images => getValidImages( images ).length > 0,
				transform: images => {
					const validImages = getValidImages( images );
					return createBlock( `jetpack/${ name }`, {
						images: validImages.map( ( { id, url, alt } ) => ( {
							id,
							url,
							alt,
						} ) ),
						ids: validImages.map( ( { id } ) => id ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/gallery', 'jetpack/slideshow' ],
				transform: ( { images } ) => {
					const validImages = getValidImages( images );
					if ( validImages.length > 0 ) {
						return createBlock( `jetpack/${ name }`, {
							images: validImages.map( ( { id, url, alt } ) => ( {
								id,
								url,
								alt,
							} ) ),
							ids: validImages.map( ( { id } ) => id ),
						} );
					}
					return createBlock( `jetpack/${ name }` );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/gallery' ],
				transform: ( { images, ids, columns, linkTo } ) =>
					createBlock( 'core/gallery', { images, ids, columns, imageCrop: true, linkTo } ),
			},
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { align, images } ) => {
					if ( images.length > 0 ) {
						return images.map( ( { id, url, alt } ) =>
							createBlock( 'core/image', { align, id, url, alt } )
						);
					}
					return createBlock( 'core/image' );
				},
			},
		],
	},
	edit,
	save,
	deprecated: [ deprecatedV1 ],
	example: {
		attributes: exampleAttributes,
	},
};
