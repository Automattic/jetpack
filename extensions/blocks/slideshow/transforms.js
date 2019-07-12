/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { filter } from 'lodash';

/**
 * Filter valid images
 *
 * @param {array} images Array of image objects
 * @return {array} Array of image objects which have id and url
 */
function getValidImages( images ) {
	return filter( images, ( { id, url } ) => id && url );
}

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/image' ],
			isMatch: images => getValidImages( images ).length > 0,
			transform: images => {
				const validImages = getValidImages( images );
				return createBlock( 'jetpack/slideshow', {
					images: validImages.map( ( { alt, caption, id, url } ) => ( {
						alt,
						caption,
						id,
						url,
					} ) ),
					ids: validImages.map( ( { id } ) => id ),
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/gallery', 'jetpack/tiled-gallery' ],
			transform: ( { images } ) => {
				const validImages = getValidImages( images );
				if ( validImages.length > 0 ) {
					return createBlock( 'jetpack/slideshow', {
						images: validImages.map( ( { alt, caption, id, url } ) => ( {
							alt,
							caption,
							id,
							url,
						} ) ),
						ids: validImages.map( ( { id } ) => id ),
					} );
				}
				return createBlock( 'jetpack/slideshow' );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/gallery' ],
			transform: ( { images, ids } ) => createBlock( 'core/gallery', { images, ids } ),
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { images } ) => {
				if ( images.length > 0 ) {
					return images.map( ( { id, url, alt, caption } ) =>
						createBlock( 'core/image', { id, url, alt, caption } )
					);
				}
				return createBlock( 'core/image' );
			},
		},
	],
};

export default transforms;
