/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import photon from 'photon';

const PhotonImage = ( { useDiv, src, maxWidth = 300, maxHeight = 300, alt, ...otherProps } ) => {
	const photonSrc = photon( src, { resize: `${ maxWidth },${ maxHeight }` } );

	return useDiv ? (
		<div style={ { backgroundImage: `url("${ src }")` } } title={ alt } { ...otherProps } />
	) : (
		<img src={ photonSrc !== null ? photonSrc : src } alt={ alt } { ...otherProps } />
	);
};

export default PhotonImage;
