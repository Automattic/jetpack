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
			isMatch: attributes => getValidImages( attributes ).length > 0,
			transform: attributes => {
				const validImages = getValidImages( attributes );
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
			transform: attributes => {
				const validImages = getValidImages( attributes );
				if ( validImages.length > 0 ) {
					return createBlock( 'jetpack/slideshow', {
						images: validImages.map( ( { alt, caption, id, url } ) => ( {
							alt,
							caption,
							id,
							url,
						} ) ),
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
			transform: ( { images } ) => createBlock( 'core/gallery', { images } ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/tiled-gallery' ],
			transform: ( { images } ) => createBlock( 'jetpack/tiled-gallery', { images }, [] ),
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
