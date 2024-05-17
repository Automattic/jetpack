import { createBlock } from '@wordpress/blocks';
import { filter } from 'lodash';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { default as deprecated } from './deprecated';
import edit from './edit';
import save from './save';
import tiledGalleryExample1 from './tiled-gallery_example-1.jpg';
import tiledGalleryExample2 from './tiled-gallery_example-2.jpg';
import tiledGalleryExample3 from './tiled-gallery_example-3.jpg';
import tiledGalleryExample4 from './tiled-gallery_example-4.jpg';
import tiledGalleryExample5 from './tiled-gallery_example-5.jpg';
import tiledGalleryExample6 from './tiled-gallery_example-6.jpg';

import './editor.scss';

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

/**
 * Filter valid images
 *
 * @param {Array} images - Array of image objects
 * @returns {Array} Array of image objects which have id and url
 */
function getValidImages( images ) {
	return filter( images, ( { id, url } ) => id && url );
}
registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/image' ],
				isMatch: images => getValidImages( images ).length > 0,
				transform: images => {
					const validImages = getValidImages( images );
					return createBlock( metadata.name, {
						images: validImages.map( ( { id, url, link, alt } ) => ( {
							id,
							url,
							link,
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
						return createBlock( metadata.name, {
							images: validImages.map( ( { id, url, link, alt } ) => ( {
								id,
								url,
								link,
								alt,
							} ) ),
							ids: validImages.map( ( { id } ) => id ),
						} );
					}
					return createBlock( metadata.name );
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
	providesContext: {
		imageCrop: 'imageCrop',
	},
	deprecated,
	example: {
		attributes: exampleAttributes,
	},
} );
