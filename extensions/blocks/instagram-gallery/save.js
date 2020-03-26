/**
 * Internal dependencies
 */
import { getGalleryCssAttributes } from './utils';

export default function save( { attributes } ) {
	const { columns, images, spacing } = attributes;

	if ( ! images.length ) {
		return null;
	}

	const { gridClasses, gridStyle, photoStyle } = getGalleryCssAttributes( columns, spacing );

	return (
		<div className={ gridClasses } style={ gridStyle }>
			{ images.map( image => (
				<a
					className="wp-block-jetpack-instagram-gallery__grid-post"
					href={ image.link }
					key={ image.link }
					rel="noopener noreferrer"
					style={ photoStyle }
					target="_blank"
				>
					<img alt={ image.title || image.url } src={ image.url } />
				</a>
			) ) }
		</div>
	);
}
