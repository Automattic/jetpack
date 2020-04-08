/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { Animate } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ImageTransition( {
	src,
	attributes
} ) {
	const [ loaded, setLoaded ] = useState( false );
	const [ size, setSize ] = useState( 'auto' );
	const { columns, spacing } = attributes;
	const transitionSpeed = '.3';
	const img = useRef();
	let componentMounted = false;

	const onImageLoad = () => {
		if ( componentMounted ) {
			setLoaded( true );
		}
	};

	useEffect( () => {
		const imgSrc = src;
		if ( imgSrc ) {
			// First load image as a new window.Image and then update local state when it is loaded,
			// this lets us handle the fade in animation
			let img = new window.Image();
			img.src = imgSrc;
			img.onload = onImageLoad;
			componentMounted = true;
		}
		if ( img.current ) {
			setSize( img.current.parentNode.getBoundingClientRect().width );
		}
	}, [ columns, spacing ] );

	const imageLoadedStyle = {
		opacity: '1',
		height: size,
		width: size,
	};

	const imageLoadedLoadingStyle = {
		opacity: '0',
	};

	let imageStyle = {
		opacity: '0',
		height: '0',
		width: '0',
		position: 'absolute',
		top: '0',
		left: '0',
		'z-index': '10',
	};

	imageStyle.transition = `opacity ${ transitionSpeed }s ease-in`;

	let loadingStyle = {
		opacity: '1',
		height: size,
		width: size,
		position: 'relative',
		top: '0',
		left: '0',
	};

	loadingStyle.transition = `opacity ${ transitionSpeed }s ease-out`;

	return (
		<>
			<Animate type="loading">
				{ ( { className: animateClasses } ) => (
					<>
						<span className={ classnames( animateClasses ) }>
							<img
								alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
								src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
								style={ loaded ? { ...loadingStyle, ...imageLoadedLoadingStyle } : loadingStyle }
							/>
						</span>
						<img
							ref={ img }
							alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
							src={ src }
							style={ loaded ? { ...imageStyle, ...imageLoadedStyle } : imageStyle }
						/>
					</>
				) }
			</Animate>
		</>
	);
}
