/**
 * External dependencies
 */
import classnames from 'classnames';

export default function save( { attributes } ) {
	const { columns, images } = attributes;

	const gridClasses = classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`
	);

	return (
		<div className={ gridClasses }>
			{ images &&
				images.map( image => (
					<a href={ image.link } key={ image.link } rel="noopener noreferrer" target="_blank">
						<img alt={ image.title || image.url } src={ image.url } />
					</a>
				) ) }
		</div>
	);
}
