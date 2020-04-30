/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import photon from 'photon';

const PhotonImage = ( { src, maxWidth = 300, maxHeight = 300, alt, ...otherProps } ) => {
	const photonSrc = photon( src, { resize: `${ maxWidth },${ maxHeight }` } );

	return <img src={ photonSrc } alt={ alt } { ...otherProps } />;
};

export default PhotonImage;
