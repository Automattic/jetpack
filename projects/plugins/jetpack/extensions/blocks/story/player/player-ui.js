import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { isBlobURL } from '@wordpress/blob';
import { useResizeObserver } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useState, useEffect, useLayoutEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { some } from 'lodash';
import blockMetadata from '../block.json';
import { Background, Controls, Header, Overlay } from './components';
import useLongPress from './lib/use-long-press';
import ProgressBar from './progress-bar';
import Slide from './slide';

const icon = getBlockIconComponent( blockMetadata );

export default function PlayerUI( { id, slides, metadata, disabled } ) {
	const { setFullscreen, setEnded, setPlaying, setMuted, showSlide } =
		useDispatch( 'jetpack/story/player' );
	const { playing, muted, currentSlideIndex, currentSlideEnded, ended, fullscreen, settings } =
		useSelect(
			select => {
				const {
					getCurrentSlideIndex,
					getSettings,
					hasCurrentSlideEnded,
					hasEnded,
					isFullscreen,
					isMuted,
					isPlaying,
				} = select( 'jetpack/story/player' );
				return {
					playing: isPlaying( id ),
					muted: isMuted( id ),
					currentSlideIndex: getCurrentSlideIndex( id ),
					currentSlideEnded: hasCurrentSlideEnded( id ),
					ended: hasEnded( id ),
					fullscreen: isFullscreen( id ),
					settings: getSettings( id ),
				};
			},
			[ id ]
		);

	const slideContainerRef = useRef( undefined );
	const [ maxSlideWidth, setMaxSlideWidth ] = useState( null );
	const setElement = useResizeObserver(
		resizeObserverEntries => {
			const width = resizeObserverEntries[ 0 ]?.contentRect.width;
			if ( width ) {
				setMaxSlideWidth( width );
			}
		},
		{ box: 'border-box' }
	);
	const [ targetAspectRatio, setTargetAspectRatio ] = useState( settings.defaultAspectRatio );
	const uploading = some( slides, media => isBlobURL( media.url ) );
	const isVideo = slideIndex => {
		const media = slideIndex < slides.length ? slides[ slideIndex ] : null;
		if ( ! media ) {
			return false;
		}
		return 'video' === media.type || ( media.mime || '' ).startsWith( 'video/' );
	};

	const playSlide = slideIndex => {
		showSlide( id, slideIndex );
	};

	const onPress = useCallback( () => {
		if ( disabled || fullscreen ) {
			return;
		}
		if ( settings.playInFullscreen && ! playing ) {
			setPlaying( id, true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playing, disabled, fullscreen ] );

	const { onTouchStart, onTouchEnd } = useLongPress( isPressed => {
		setPlaying( id, ! isPressed );
	}, [] );

	const tryPreviousSlide = useCallback( () => {
		if ( currentSlideIndex > 0 ) {
			playSlide( currentSlideIndex - 1 );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ currentSlideIndex ] );

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			playSlide( currentSlideIndex + 1 );
		} else {
			setEnded( id );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ currentSlideIndex, slides ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( id, false );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// pause player when disabled
	useEffect( () => {
		if ( disabled && playing ) {
			setPlaying( id, false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ disabled, playing ] );

	// try next slide
	useEffect( () => {
		if ( playing && currentSlideEnded ) {
			tryNextSlide();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playing, currentSlideEnded ] );

	// Max slide width is used to display the story in portrait mode on desktop
	useLayoutEffect( () => {
		const containerHeight = slideContainerRef?.current.offsetHeight;
		if ( ! slideContainerRef.current || ! settings.defaultAspectRatio || containerHeight <= 0 ) {
			return;
		}
		setElement( slideContainerRef.current );
		let ratioBasedWidth = Math.round( settings.defaultAspectRatio * containerHeight );
		if ( fullscreen ) {
			const width = slideContainerRef.current.offsetWidth; // Get the current width
			ratioBasedWidth =
				Math.abs( 1 - ratioBasedWidth / width ) < settings.cropUpTo ? width : ratioBasedWidth;
		}
		setMaxSlideWidth( ratioBasedWidth );
		setTargetAspectRatio( ratioBasedWidth / containerHeight );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ setElement, fullscreen ] );

	let label;
	if ( fullscreen ) {
		label = [
			__( 'You are currently playing a story.', 'jetpack' ),
			playing
				? __( 'Press space to pause.', 'jetpack' )
				: __( 'Press space to play.', 'jetpack', /* dummy arg to avoid bad minification */ 0 ),
			__( 'Press escape to exit.', 'jetpack' ),
		].join( ' ' );
	} else {
		label = __( 'Play story', 'jetpack' );
	}

	let role;
	if ( disabled ) {
		role = 'presentation';
	} else {
		role = fullscreen ? 'dialog' : 'button';
	}

	/* eslint-disable jsx-a11y/click-events-have-key-events */
	return (
		<div className="wp-story-display-contents">
			<div
				role={ role }
				aria-label={ label }
				tabIndex={ fullscreen ? -1 : 0 }
				className={ clsx( 'wp-story-container', {
					'wp-story-with-controls': ! disabled && ! fullscreen && ! settings.playInFullscreen,
					'wp-story-fullscreen': fullscreen,
					'wp-story-ended': ended,
					'wp-story-disabled': disabled,
					'wp-story-clickable': ! disabled && ! fullscreen,
				} ) }
				style={ { maxWidth: `${ maxSlideWidth }px` } }
				onClick={ onPress }
				onTouchStart={ onTouchStart }
				onTouchEnd={ onTouchEnd }
			>
				<Header { ...metadata } fullscreen={ fullscreen } onExitFullscreen={ onExitFullscreen } />
				<div ref={ slideContainerRef } className="wp-story-wrapper">
					{ slides.map( ( media, index ) => (
						<Slide
							playerId={ id }
							key={ index }
							media={ media }
							index={ index }
							playing={ ! disabled && playing }
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
	/* eslint-enable jsx-a11y/click-events-have-key-events */
}
