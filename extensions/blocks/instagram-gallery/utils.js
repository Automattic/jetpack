/**
 * External dependencies
 */
import classnames from 'classnames';

export const getGalleryCssAttributes = ( columns, spacing ) => ( {
	gridClasses: classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`
	),
	gridStyle: {
		gridGap: spacing,
	},
	photoStyle: {
		padding: spacing,
	},
} );
