/**
 * External dependencies
 */
import classNames from 'classnames';

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

/**
 * Internal dependencies
 */
import Slide from './slide';
import ProgressBar from './progress-bar';
import { Background, Controls, Header, Overlay } from './components';
import useResizeObserver from './use-resize-observer';

export const Player = ( { slides, fullscreen, setFullscreen, disabled, ...settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ ended, setEnded ] = useState( false );
	const [ muted, setMuted ] = useState( settings.startMuted );
	const [ currentSlideProgress, setCurrentSlideProgress ] = useState( 0 );

	const [ slideWidth, setSlideWidth ] = useState( 279 );
	const [ resizeListener, { height } ] = useResizeObserver();

	const showSlide = ( slideIndex, play = true ) => {
		setCurrentSlideProgress( 0 );
		updateSlideIndex( slideIndex );

		if ( play ) {
			setPlaying( play );
		}
	};

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
	}, [ currentSlideIndex ] );

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

	// reset player on slide change
	useEffect( () => {
		setPlaying( false );
		showSlide( 0, false );
	}, [ slides ] );

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
	}, [] );

	useEffect( () => {
		if ( height ) {
			const width = Math.round( settings.defaultAspectRatio * height );
			setSlideWidth( width );
		}
	}, [ height ] );

	return (
		<>
			<div
				className={ classNames( 'wp-story-container', {
					'wp-story-with-controls': ! disabled && ! fullscreen && ! settings.playInFullscreen,
					'wp-story-fullscreen': fullscreen,
					'wp-story-ended': ended,
					'wp-story-disabled': disabled,
				} ) }
				style={ { width: `${ slideWidth }px` } }
			>
				<Header
					{ ...settings.metadata }
					fullscreen={ fullscreen }
					onExitFullscreen={ onExitFullscreen }
				/>
				<div className="wp-story-wrapper">
					{ resizeListener }
					{ slides.map( ( media, index ) => (
						<Slide
							key={ index }
							media={ media }
							index={ index }
							currentSlideIndex={ currentSlideIndex }
							playing={ currentSlideIndex === index && playing }
							muted={ muted }
							ended={ ended }
							onProgress={ setCurrentSlideProgress }
							onEnd={ tryNextSlide }
							settings={ settings }
						/>
					) ) }
				</div>
				<Overlay
					playing={ playing }
					ended={ ended }
					hasPrevious={ currentSlideIndex > 0 }
					hasNext={ currentSlideIndex < slides.length - 1 }
					disabled={ settings.disabled }
					tapToPlayPause={ ! fullscreen && settings.tapToPlayPause }
					onClick={ () => {
						if ( ! fullscreen && ! playing && settings.playInFullscreen ) {
							setFullscreen( true );
						}
						if ( ended && ! playing ) {
							showSlide( 0 );
						} else {
							setPlaying( ! playing );
						}
					} }
					onPreviousSlide={ tryPreviousSlide }
					onNextSlide={ tryNextSlide }
				/>
				<ProgressBar
					slides={ slides }
					fullscreen={ fullscreen }
					currentSlideIndex={ currentSlideIndex }
					currentSlideProgress={ currentSlideProgress }
					onSlideSeek={ showSlide }
				/>
				<Controls
					playing={ playing }
					muted={ muted }
					setPlaying={ setPlaying }
					setMuted={ setMuted }
				/>
			</div>
			{ fullscreen && (
				<Background currentMedia={ settings.blurredBackground && slides[ currentSlideIndex ] } />
			) }
		</>
	);
};
