/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

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

	const containerClasses = classnames( 'wp-block-jetpack-instagram-gallery__placeholder', {
		'is-loaded': loaded,
	} );
	const containerStyles = loaded ? {} : { height: containerHeight };
	const imageClasses = classnames( { 'is-loaded': loaded } );

	return (
		<span style={ containerStyles } className={ containerClasses }>
			<img alt={ alt } className={ imageClasses } ref={ img } src={ src } />
		</span>
	);
}
