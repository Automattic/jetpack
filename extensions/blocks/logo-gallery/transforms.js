/**
 * External dependencies
 */
import { filter } from 'lodash';
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/gallery', 'jetpack/tiled-gallery', 'jetpack/slideshow' ],
			transform: attributes => {
				const validImages = filter( attributes.images, ( { id, url } ) => id && url );
				if ( validImages.length > 0 ) {
					return createBlock( 'jetpack/logo-gallery', {
						images: validImages.map( ( { id, url, alt } ) => ( {
							id,
							url,
							alt,
						} ) ),
					} );
				}
				return createBlock( 'jetpack/logo-gallery' );
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
			blocks: [ 'jetpack/slideshow' ],
			transform: ( { images } ) => createBlock( 'jetpack/slideshow', { images }, [] ),
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { images } ) => {
				if ( images.length > 0 ) {
					return images.map( ( { id, url, alt } ) =>
						createBlock( 'core/image', { id, url, alt } )
					);
				}
				return createBlock( 'core/image' );
			},
		},
	],
};

export default transforms;
