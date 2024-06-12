import { useEffect, useState, useRef } from '@wordpress/element';
import clsx from 'clsx';

export default function ImageTransition( { src, alt, spacing } ) {
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

	// The following offset is required to counter the padding needed on the
	// parent elements so that resizing the grid gap spacing in the editor works
	// across browsers and between FSE and post editor.
	// Negative margin used as `padding: 0 !important` prevents redraw in Safari.
	const containerOffset = spacing * -1;

	const containerClasses = clsx( 'wp-block-jetpack-instagram-gallery__placeholder', {
		'is-loaded': loaded,
	} );
	const containerStyles = loaded
		? { margin: containerOffset }
		: {
				margin: containerOffset,
				height: containerHeight,
		  };
	const imageClasses = clsx( { 'is-loaded': loaded } );

	return (
		<span style={ containerStyles } className={ containerClasses }>
			<img alt={ alt } className={ imageClasses } ref={ img } src={ src } />
		</span>
	);
}
