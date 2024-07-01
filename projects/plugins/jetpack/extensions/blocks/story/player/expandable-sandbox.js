import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import clsx from 'clsx';
import * as fullscreenAPI from './lib/fullscreen-api';
import ShadowRoot from './lib/shadow-root';
import Modal from './modal';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

export default function ExpandableSandbox( {
	className,
	fullscreenClassName,
	bodyFullscreenClassName,
	fullscreen,
	shadowDOM,
	onKeyDown,
	onExitFullscreen,
	playerQuerySelector,
	children,
} ) {
	const rootElementRef = useRef();
	const modalRef = useRef();
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );
	const shouldUseFullscreenAPI = isMobile && fullscreenAPI.enabled();
	const isFullPageModalOpened = fullscreen && ! shouldUseFullscreenAPI;
	const isFullscreen = fullscreen && shouldUseFullscreenAPI;

	useLayoutEffect( () => {
		if ( shouldUseFullscreenAPI ) {
			if ( fullscreen ) {
				if ( rootElementRef.current ) {
					fullscreenAPI.launch( rootElementRef.current, onExitFullscreen );
				}
			} else if ( fullscreenAPI.element() ) {
				fullscreenAPI.exit();
			}
			return;
		}
		if ( fullscreen ) {
			// position: fixed does not work as expected on mobile safari
			// To fix that we need to add a fixed positioning to body,
			// retain the current scroll position and restore it when we exit fullscreen
			setLastScrollPosition( [
				document.documentElement.scrollLeft,
				document.documentElement.scrollTop,
			] );
			document.body.classList.add( bodyFullscreenClassName );
			document.getElementsByTagName( 'html' )[ 0 ].classList.add( bodyFullscreenClassName );
			if ( modalRef.current ) {
				const storyPlayer = modalRef.current.querySelector( playerQuerySelector );
				storyPlayer && storyPlayer.focus();
			}
		} else {
			document.body.classList.remove( bodyFullscreenClassName );
			document.getElementsByTagName( 'html' )[ 0 ].classList.remove( bodyFullscreenClassName );
			if ( lastScrollPosition ) {
				window.scrollTo( ...lastScrollPosition );
				const storyPlayer = rootElementRef.current.querySelector( playerQuerySelector );
				storyPlayer && storyPlayer.focus();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ fullscreen ] );

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<>
			<ShadowRoot { ...shadowDOM }>
				<div
					ref={ rootElementRef }
					className={ clsx( className, {
						[ fullscreenClassName ]: isFullscreen,
					} ) }
					onKeyDown={ onKeyDown }
				>
					{ ! isFullPageModalOpened && children }
				</div>
			</ShadowRoot>
			<Modal
				className={ clsx( className, {
					[ fullscreenClassName ]: isFullPageModalOpened,
				} ) }
				isOpened={ isFullPageModalOpened }
				onRequestClose={ onExitFullscreen }
				shadowDOM={ shadowDOM }
				onKeyDown={ isFullPageModalOpened && onKeyDown }
				focusOnMount={ false }
				modalRef={ modalRef }
			>
				{ isFullPageModalOpened && children }
			</Modal>
		</>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}
