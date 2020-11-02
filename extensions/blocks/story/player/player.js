/**
 * External dependencies
 */
import classNames from 'classnames';
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createElement,
	useRef,
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import { isBlobURL } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Slide from './slide';
import icon from '../icon';
import ProgressBar from './progress-bar';
import { Background, Controls, Header, Overlay } from './components';
import useResizeObserver from './use-resize-observer';
import * as fullscreenAPI from './lib/fullscreen-api';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

export const Player = ( { slides, disabled, ref, ...settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ ended, setEnded ] = useState( false );
	const [ muted, setMuted ] = useState( settings.startMuted );
	const [ currentSlideProgress, setCurrentSlideProgress ] = useState( 0 );

	const slideContainerRef = useRef();
	const appRef = useRef();

	const [ maxSlideWidth, setMaxSlideWidth ] = useState( null );
	const [ resizeListener, { width, height } ] = useResizeObserver();
	const [ targetAspectRatio, setTargetAspectRatio ] = useState( settings.defaultAspectRatio );

	const [ fullscreen, setFullscreen ] = useState( false );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );

	const uploading = some( slides, media => isBlobURL( media.url ) );
	const showProgressBar = fullscreen || ! settings.showSlideCount;
	const isVideo = slideIndex => {
		const media = slideIndex < slides.length ? slides[ slideIndex ] : null;
		if ( ! media ) {
			return false;
		}
		return 'video' === media.type || ( media.mime || '' ).startsWith( 'video/' );
	};

	const showSlide = ( slideIndex, play = settings.playOnNextSlide ) => {
		setCurrentSlideProgress( 0 );
		updateSlideIndex( slideIndex );

		if ( play ) {
			setPlaying( play );
		}
	};

	const onPress = useCallback( () => {
		if ( disabled ) {
			return;
		}
		if ( ! fullscreen && ! playing && settings.playInFullscreen ) {
			setFullscreen( true );
		}
		if ( ended && ! playing ) {
			showSlide( 0 );
		}
		if ( ! playing && ! fullscreen ) {
			setPlaying( true );
		}
	}, [ playing, ended, fullscreen, disabled ] );

	const tryPreviousSlide = useCallback( () => {
		if ( currentSlideIndex > 0 ) {
			showSlide( currentSlideIndex - 1 );
		}
	}, [ currentSlideIndex ] );

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			showSlide( currentSlideIndex + 1 );
		} else {
			setPlaying( false );
			setEnded( true );
			setCurrentSlideProgress( 100 );
			if ( settings.exitFullscreenOnEnd ) {
				setFullscreen( false );
			}
		}
	}, [ currentSlideIndex, slides ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( false );
		if ( settings.playInFullscreen ) {
			setPlaying( false );
		}
	}, [ fullscreen ] );

	// pause player when disabled
	useEffect( () => {
		if ( disabled && playing ) {
			setPlaying( false );
		}
	}, [ disabled, playing ] );

	// track play/pause state and check ending
	useLayoutEffect( () => {
		if ( playing ) {
			setEnded( false );
		}
	}, [ playing ] );

	useEffect( () => {
		if ( settings.loadInFullscreen ) {
			setFullscreen( true );
		}
		if ( settings.playOnLoad ) {
			setPlaying( true );
		}
	}, [] );

	// Max slide width is used to display the story in portrait mode on desktop
	useLayoutEffect( () => {
		if ( ! slideContainerRef.current ) {
			return;
		}
		let ratioBasedWidth = Math.round(
			settings.defaultAspectRatio * slideContainerRef.current.offsetHeight
		);
		if ( fullscreen ) {
			ratioBasedWidth =
				Math.abs( 1 - ratioBasedWidth / width ) < settings.cropUpTo ? width : ratioBasedWidth;
		}
		setMaxSlideWidth( ratioBasedWidth );
	}, [ width, height, fullscreen ] );

	useLayoutEffect( () => {
		if (
			maxSlideWidth &&
			slideContainerRef.current &&
			slideContainerRef.current.offsetHeight > 0
		) {
			setTargetAspectRatio( maxSlideWidth / slideContainerRef.current.offsetHeight );
		}
	}, [ maxSlideWidth ] );

	useLayoutEffect( () => {
		if ( fullscreen ) {
			if ( isMobile && fullscreenAPI.enabled() && ! settings.loadInFullscreen ) {
				fullscreenAPI.launch( appRef.current );
			} else {
				// position: fixed does not work as expected on mobile safari
				// To fix that we need to add a fixed positioning to body,
				// retain the current scroll position and restore it when we exit fullscreen
				setLastScrollPosition( [
					document.documentElement.scrollLeft,
					document.documentElement.scrollTop,
				] );
				document.body.classList.add( 'wp-story-in-fullscreen' );
				document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
			}
		} else {
			// eslint-disable-next-line no-lonely-if
			if ( fullscreenAPI.element() ) {
				fullscreenAPI.exit();
			} else {
				document.body.classList.remove( 'wp-story-in-fullscreen' );
				if ( lastScrollPosition ) {
					window.scrollTo( ...lastScrollPosition );
				}
				document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
			}
		}
	}, [ fullscreen ] );

	return (
		/* eslint-disable jsx-a11y/click-events-have-key-events */
		<div
			ref={ appRef }
			className={ classNames( [ 'wp-story-app', { 'wp-story-fullscreen': fullscreen } ] ) }
		>
			{ resizeListener }
			<div
				role={ disabled ? 'presentation' : 'button' }
				aria-label={ __( 'Play story', 'jetpack' ) }
				tabIndex={ fullscreen ? -1 : 0 }
				className={ classNames( 'wp-story-container', {
					'wp-story-with-controls': ! disabled && ! fullscreen && ! settings.playInFullscreen,
					'wp-story-fullscreen': fullscreen,
					'wp-story-ended': ended,
					'wp-story-disabled': disabled,
					'wp-story-clickable': ! disabled && ! fullscreen,
				} ) }
				style={ { maxWidth: `${ maxSlideWidth }px` } }
				onClick={ onPress }
			>
				<Header
					{ ...settings.metadata }
					fullscreen={ fullscreen }
					onExitFullscreen={ onExitFullscreen }
				/>
				<div ref={ slideContainerRef } className="wp-story-wrapper">
					{ slides.map( ( media, index ) => (
						<Slide
							key={ index }
							media={ media }
							index={ index }
							currentSlideIndex={ currentSlideIndex }
							playing={ playing }
							uploading={ uploading }
							muted={ muted }
							setMuted={ setMuted }
							ended={ ended }
							onProgress={ setCurrentSlideProgress }
							onEnd={ tryNextSlide }
							settings={ settings }
							targetAspectRatio={ targetAspectRatio }
							isVideo={ isVideo( currentSlideIndex ) }
						/>
					) ) }
				</div>
				<Overlay
					icon={ settings.showSlideCount && icon }
					slideCount={ slides.length }
					ended={ ended }
					hasPrevious={ currentSlideIndex > 0 }
					hasNext={ currentSlideIndex < slides.length - 1 }
					disabled={ disabled }
					onPreviousSlide={ tryPreviousSlide }
					onNextSlide={ tryNextSlide }
				/>
				{ showProgressBar && (
					<ProgressBar
						slides={ slides }
						fullscreen={ fullscreen }
						currentSlideIndex={ currentSlideIndex }
						currentSlideProgress={ currentSlideProgress }
						onSlideSeek={ showSlide }
					/>
				) }
				<Controls
					playing={ playing }
					muted={ muted }
					setPlaying={ setPlaying }
					setMuted={ setMuted }
					showMute={ isVideo( currentSlideIndex ) }
				/>
			</div>
			{ fullscreen && (
				<Background
					currentMedia={
						settings.blurredBackground &&
						slides.length > currentSlideIndex &&
						slides[ currentSlideIndex ]
					}
				/>
			) }
		</div>
	);
};
