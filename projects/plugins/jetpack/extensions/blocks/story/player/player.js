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
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Slide from './slide';
import icon from '../icon';
import ProgressBar from './progress-bar';
import { Background, Controls, Header, Overlay } from './components';
import * as fullscreenAPI from './lib/fullscreen-api';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

export const Player = ( { id, slides, fullscreen, setFullscreen, disabled, ...settings } ) => {
	const { setPlaying, setMuted, showSlide } = useDispatch( 'jetpack/story/player' );

	const { playing, muted, currentSlideIndex, currentSlideEnded } = useSelect( select => {
		const { isPlaying, isMuted, getCurrentSlideIndex, hasCurrentSlideEnded } = select(
			'jetpack/story/player'
		);
		return {
			playing: isPlaying( id ),
			muted: isMuted( id ),
			currentSlideIndex: getCurrentSlideIndex( id ),
			currentSlideEnded: hasCurrentSlideEnded( id ),
		};
	}, [] );

	const slideContainerRef = useRef();
	const appRef = useRef();

	const [ maxSlideWidth, setMaxSlideWidth ] = useState( null );
	const [ resizeListener, { width, height } ] = useResizeObserver();
	const [ targetAspectRatio, setTargetAspectRatio ] = useState( settings.defaultAspectRatio );
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );
	const ended = currentSlideEnded && currentSlideIndex === slides.length - 1;
	const uploading = some( slides, media => isBlobURL( media.url ) );
	const isVideo = slideIndex => {
		const media = slideIndex < slides.length ? slides[ slideIndex ] : null;
		if ( ! media ) {
			return false;
		}
		return 'video' === media.type || ( media.mime || '' ).startsWith( 'video/' );
	};

	const playSlide = ( slideIndex, play = settings.playOnNextSlide ) => {
		showSlide( id, slideIndex );

		if ( play ) {
			setPlaying( id, play );
		}
	};

	const onPress = useCallback( () => {
		if ( disabled ) {
			return;
		}
		if ( ended && ! playing ) {
			playSlide( 0 );
		}
		if ( ! fullscreen && ! playing && settings.playInFullscreen ) {
			setFullscreen( true );
			setPlaying( id, true );
		}
	}, [ playing, ended, fullscreen, disabled ] );

	const tryPreviousSlide = useCallback( () => {
		if ( currentSlideIndex > 0 ) {
			playSlide( currentSlideIndex - 1 );
		}
	}, [ currentSlideIndex ] );

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			playSlide( currentSlideIndex + 1 );
		} else {
			setPlaying( id, false );
			if ( settings.exitFullscreenOnEnd ) {
				setFullscreen( false );
			}
		}
	}, [ currentSlideIndex, slides ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( false );
		if ( settings.playInFullscreen ) {
			setPlaying( id, false );
		}
	}, [ fullscreen ] );

	// pause player when disabled
	useEffect( () => {
		if ( disabled && playing ) {
			setPlaying( id, false );
		}
	}, [ disabled, playing ] );

	useEffect( () => {
		if ( settings.loadInFullscreen ) {
			setFullscreen( true );
		}
		if ( settings.playOnLoad ) {
			setPlaying( id, true );
		}
	}, [] );

	// try next slide
	useEffect( () => {
		if ( playing && currentSlideEnded ) {
			tryNextSlide();
		}
	}, [ playing, currentSlideEnded ] );

	useLayoutEffect( () => {
		const wrapperHeight = ( wrapperRef.current && wrapperRef.current.offsetHeight ) || height;
		const ratioBasedWidth = Math.round( settings.defaultAspectRatio * wrapperHeight );
		if ( ! fullscreen ) {
			setMaxSlideWidth( ratioBasedWidth );
		} else {
			const newMaxSlideWidth =
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
							playerId={ id }
							key={ index }
							media={ media }
							index={ index }
							playing={ playing }
							uploading={ uploading }
							settings={ settings }
							targetAspectRatio={ targetAspectRatio }
						/>
					) ) }
				</div>
				<Overlay
					icon={ icon }
					slideCount={ slides.length }
					showSlideCount={ settings.showSlideCount }
					ended={ ended }
					hasPrevious={ currentSlideIndex > 0 }
					hasNext={ currentSlideIndex < slides.length - 1 }
					onPreviousSlide={ tryPreviousSlide }
					onNextSlide={ tryNextSlide }
				/>
				{ settings.showProgressBar && (
					<ProgressBar
						playerId={ id }
						slides={ slides }
						disabled={ ! fullscreen }
						onSlideSeek={ playSlide }
						maxBullets={ fullscreen ? settings.maxBulletsFullscreen : settings.maxBullets }
						fullscreen={ fullscreen }
					/>
				) }
				<Controls
					playing={ playing }
					muted={ muted }
					onPlayPressed={ () => setPlaying( id, ! playing ) }
					onMutePressed={ () => setMuted( id, ! muted ) }
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
