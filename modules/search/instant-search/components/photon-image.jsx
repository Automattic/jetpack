/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import photon from 'photon';

/**
 * Strips query string values from URLs; photon can't handle them.
 *
 * @param {string} url - Image URL
 *
 * @returns {string} - Image URL without any query strings.
 */
function stripQueryString( url ) {
	return url.split( '?', 1 )[ 0 ];
}

const PhotonImage = ( { useDiv, src, maxWidth = 300, maxHeight = 300, alt, ...otherProps } ) => {
	const photonSrc = photon( stripQueryString( src ), { resize: `${ maxWidth },${ maxHeight }` } );
	const srcToDisplay = photonSrc !== null ? photonSrc : src;

	return useDiv ? (
		<div
			style={ { backgroundImage: `url("${ srcToDisplay }")` } }
			title={ alt }
			{ ...otherProps }
		/>
	) : (
		<img src={ srcToDisplay } alt={ alt } { ...otherProps } />
	);
};

export default PhotonImage;
