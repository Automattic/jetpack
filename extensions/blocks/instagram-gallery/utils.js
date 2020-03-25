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

export const getScreenCenterSpecs = ( width, height ) => {
	const screenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : window.screenY;
	const screenLeft = typeof window.screenLeft !== 'undefined' ? window.screenLeft : window.screenX;

	return [
		'width=' + width,
		'height=' + height,
		'top=' + ( screenTop + window.innerHeight / 2 - height / 2 ),
		'left=' + ( screenLeft + window.innerWidth / 2 - width / 2 ),
	].join();
};
