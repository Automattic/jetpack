/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Animate } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const imageLoadedStyle = {
	opacity: '1',
    height: 'auto',
    width: 'auto',
};

const imageLoadedLoadingStyle = {
    opacity: '0',
    display: 'none',
};

export default function ImageFade( {
	src,
	opacityTransition,
	children,
	style,
	photoStyle,
	...rest
} ) {
	const [ loaded, setLoaded ] = useState( false );
	let componentMounted = false;

	const onImageLoad = () => {
		if ( componentMounted ) {
			setLoaded( true );
		}
	};

	useEffect( () => {
		const imgSrc = src;
		if ( imgSrc ) {
			//load image in a new window.Image and update local state when image is loaded
			let img = new window.Image();
			img.src = imgSrc;
			img.onload = onImageLoad;
			componentMounted = true;
		}
	}, [] );

	//add transition style
	let imageStyle = {
		opacity: '0',
        height: '0',
        width: '0'
	};

	imageStyle.transition = `opacity ${ opacityTransition }s ease 0s`;

	let loaderStyle = {
        opacity: '1',
        display: 'block'
	};

	loaderStyle.transition = `opacity .5s ease 0s`;

	return (
		<>
			<Animate type="loading">
				{ ( { className: animateClasses } ) => (
					<span
						className={ classnames(
							'wp-block-jetpack-instagram-gallery__grid-post',
							! loaded ? animateClasses : null
						) }
						style={ photoStyle }
					>
						<img
							alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
							src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
							style={ loaded ? { ...loaderStyle, ...imageLoadedLoadingStyle } : loaderStyle }
						/>
						<img
							alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
							src={ src }
							style={ loaded ? { ...style, ...imageStyle, ...imageLoadedStyle } : imageStyle }
						/>
					</span>
				) }
			</Animate>
		</>
	);
}
