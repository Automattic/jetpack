/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

export default function ImageTransition( { src } ) {
	const [ loaded, setLoaded ] = useState( false );
	const [ size, setSize ] = useState( 'auto' );

	const img = useRef();

	const transitionSpeed = '.5';

	const onImageLoad = () => {
		setLoaded( true );
		setSize( 'auto' );
	};

	useEffect( () => {
		const imgSrc = src;
		if ( imgSrc ) {
			// First pre-load image as a new window.Image and then update local state when it is loaded,
			// this lets us handle the fade in animation
			const tmpImg = new window.Image();
			tmpImg.src = imgSrc;
			tmpImg.onload = onImageLoad;
		}
		if ( img.current ) {
			setSize( img.current.parentNode.getBoundingClientRect().width );
		}
	}, [] );

	const imageStyle = {
		opacity: '0',
		transition: `opacity ${ transitionSpeed }s ease-in-out`,
	};

	const imageLoadedStyle = {
		opacity: '1',
	};

	const containerStyle = {
		opacity: '1',
		backgroundColor: '#A7A79F',
		height: size,
		display: 'block',
	};

	const containerLoadedStyle = {
		height: 'auto',
		animation: 'none',
	};

	return (
		<>
			<span
				style={ loaded ? { ...containerStyle, ...containerLoadedStyle } : containerStyle }
				className="wp-block-jetpack-instagram-gallery__placeholder"
			>
				<img
					ref={ img }
					alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
					src={ src }
					style={ loaded ? { ...imageStyle, ...imageLoadedStyle } : imageStyle }
				/>
			</span>
		</>
	);
}
