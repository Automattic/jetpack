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

export const Player = ( { slides, fullscreen, setFullscreen, disabled, ...settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ ended, setEnded ] = useState( false );
	const [ muted, setMuted ] = useState( settings.startMuted );
	const [ currentSlideProgress, setCurrentSlideProgress ] = useState( 0 );

	const wrapperRef = useRef();
	const [ maxSlideWidth, setMaxSlideWidth ] = useState( null );
	const [ resizeListener, { width, height } ] = useResizeObserver();
	const [ targetAspectRatio, setTargetAspectRatio ] = useState( settings.defaultAspectRatio );

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

	useLayoutEffect( () => {
		if ( ! fullscreen ) {
			if ( ! wrapperRef.current ) {
				return;
			}
			const wrapperHeight = wrapperRef.current.offsetHeight;
			const ratioBasedWidth = Math.round( settings.defaultAspectRatio * wrapperHeight );
			setMaxSlideWidth( ratioBasedWidth );
		} else {
			const wrapperHeight = ( wrapperRef.current && wrapperRef.current.offsetHeight ) || height;
			const ratioBasedWidth = Math.round( settings.defaultAspectRatio * wrapperHeight );
			const newMaxSlideWidth =
				Math.abs( 1 - ratioBasedWidth / width ) < settings.cropUpTo ? width : ratioBasedWidth;
			setMaxSlideWidth( newMaxSlideWidth );
		}
	}, [ width, height, fullscreen ] );

	useLayoutEffect( () => {
		if ( wrapperRef.current && wrapperRef.current.offsetHeight > 0 ) {
			setTargetAspectRatio( wrapperRef.current.offsetWidth / wrapperRef.current.offsetHeight );
		}
	}, [ width, height ] );

	return (
		/* eslint-disable jsx-a11y/click-events-have-key-events */
		<>
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
				<div className="wp-story-wrapper" ref={ wrapperRef }>
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
		</>
	);
};
