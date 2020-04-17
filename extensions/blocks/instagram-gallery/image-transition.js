/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */

export default function ImageTransition( { src, alt } ) {
	const [ loaded, setLoaded ] = useState( false );
	const [ containerHeight, setContainerHeight ] = useState( 'auto' );

	const img = useRef();

	const onImageLoad = () => {
		setLoaded( true );
		setContainerHeight( 'auto' );
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
			setContainerHeight( img.current.parentNode.getBoundingClientRect().width );
		}
	}, [ src ] );

	const imageStyle = {
		opacity: '0',
		transition: `opacity .5s ease-in-out`,
	};

	const imageLoadedStyle = {
		opacity: '1',
	};

	const containerStyle = {
		opacity: '1',
		backgroundColor: '#A7A79F',
		height: containerHeight,
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
					alt={ alt }
					src={ src }
					style={ loaded ? { ...imageStyle, ...imageLoadedStyle } : imageStyle }
				/>
			</span>
		</>
	);
}
