import React from 'react';
import { usePhoton } from '../lib/hooks/use-photon';

const PhotonImage = props => {
	const {
		alt,
		isPhotonEnabled,
		maxHeight = 600,
		maxWidth = 600,
		src: originalSrc,
		lazyLoad = true,
		...otherProps
	} = props;

	const src = usePhoton( originalSrc, maxWidth, maxHeight, isPhotonEnabled );

	return (
		<img alt={ alt } src={ src } loading={ `${ lazyLoad ? 'lazy' : 'eager' }` } { ...otherProps } />
	);
};

export default PhotonImage;
