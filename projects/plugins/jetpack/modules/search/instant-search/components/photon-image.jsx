/**
 * External dependencies
 */
import React, { useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
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

	const image = useRef();
	const [ lazySrc, setLazySrc ] = useState( null );
	const src = usePhoton( originalSrc, maxWidth, maxHeight, isPhotonEnabled );

	// Enable lazy loading via IntersectionObserver if possible.
	useEffect( () => {
		// Wait until src is available
		if ( ! src ) {
			return;
		}

		let observer = null;
		if ( lazyLoad && 'IntersectionObserver' in window ) {
			observer = new window.IntersectionObserver( ( entries, obs ) => {
				for ( const entry of entries ) {
					if ( entry.isIntersecting ) {
						setLazySrc( src );
						obs.unobserve( entry.target );
					}
				}
			} );
			observer.observe( image.current );
		} else {
			setLazySrc( src );
		}
		return () => {
			observer?.disconnect();
		};
	}, [ lazyLoad, src ] );

	return <img alt={ alt } ref={ image } src={ lazySrc } { ...otherProps } />;
};

export default PhotonImage;
