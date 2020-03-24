/**
 * External dependencies
 */
import classnames from 'classnames';

export const getGalleryCssAttributes = ( columns, photosPadding ) => ( {
	gridClasses: classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`
	),
	gridStyle: {
		gridGap: photosPadding,
	},
	photoStyle: {
		padding: photosPadding,
	},
} );
