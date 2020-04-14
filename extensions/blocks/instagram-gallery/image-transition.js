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
	const { columns } = attributes;
	const transitionSpeed = 1;
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
			//load image in a new window.Image and update local state when image is loaded
			let img = new window.Image();
			img.src = imgSrc;
			img.onload = onImageLoad;
			componentMounted = true;
		}
		if ( img.current ) {
			setSize( img.current.parentNode.getBoundingClientRect().width );
		}
	}, [ columns ] );

	const imageLoadedStyle = {
		opacity: '1',
		height: size,
		width: size,
	};

	const imageLoadedLoadingStyle = {
		opacity: '0',
	};

	//add transition style
	let imageStyle = {
		opacity: '0',
		height: '0',
		width: '0',
		position: 'absolute',
		top: '0',
		left: '0',
		'z-index': '10',
	};

	imageStyle.transition = `opacity ${ transitionSpeed }s ease 0s`;

	let loaderStyle = {
		opacity: '1',
		height: size,
		width: size,
		position: 'relative',
		top: '0',
		left: '0',
	};

	loaderStyle.transition = `opacity ${ transitionSpeed }s ease 0s`;

	return (
		<>
			<Animate type="loading">
				{ ( { className: animateClasses } ) => (
					<>
						<span className={ classnames( animateClasses ) }>
							<img
								alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
								src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
								style={ loaded ? { ...loaderStyle, ...imageLoadedLoadingStyle } : loaderStyle }
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
