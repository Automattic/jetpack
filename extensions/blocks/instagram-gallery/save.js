/**
 * Internal dependencies
 */
import { getGalleryCssAttributes } from './utils';

export default function save( { attributes } ) {
	const { columns, images, photosPadding } = attributes;

	const { gridClasses, gridStyle, photoStyle } = getGalleryCssAttributes( columns, photosPadding );

	return (
		<div className={ gridClasses } style={ gridStyle }>
			{ images &&
				images.map( image => (
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
