/**
 * External dependencies
 */
import { html } from 'htm/preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { render } from 'preact';
import { EventEmitter } from 'events';

/**
 * Internal dependencies
 */
import Slide from './slide';
import ProgressBar from './progress-bar';

export const playerEvents = new EventEmitter();

export const Player = ( { slides, ...settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ ended, setEnded ] = useState( false );
	const [ muted, setMuted ] = useState( settings.startMuted );
	const [ loading, setLoading ] = useState( true );
	const [ currentSlideProgress, setCurrentSlideProgress ] = useState( 0 );

	const showSlide = ( slideIndex, play = true ) => {
		setCurrentSlideProgress( 0 );
		updateSlideIndex( slideIndex );

		if ( play ) {
			setPlaying( true );
		}
	};

	const tryPreviousSlide = useCallback( () => {
		if ( currentSlideIndex > 0 ) {
			showSlide( currentSlideIndex - 1 );
		}
	}, [ currentSlideIndex, slides ] );

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			showSlide( currentSlideIndex + 1 );
		} else {
			setPlaying( false );
			setEnded( true );
		}
	}, [ currentSlideIndex, slides ] );

	useEffect( () => {
		playerEvents.emit( playing ? 'play' : 'pause' );
	}, [ playing ] );

	useEffect( () => {
		if ( playing ) {
			setEnded( false );
		}
	}, [ playing ] );

	useEffect( () => {
		playerEvents.emit( muted ? 'mute' : 'unmute' );
	}, [ muted ] );

	useEffect( () => {
		playerEvents.emit( fullscreen ? 'go-fullscreen' : 'exit-fullscreen' );
	}, [ fullscreen ] );

	useEffect( () => {
		if ( settings.loadInFullScreen ) {
			setFullscreen( true );
		}
	}, [] );

	useEffect( () => {
		playerEvents.emit( 'seek', currentSlideIndex );
	}, [ currentSlideIndex ] );

	useEffect( () => {
		if ( ! loading ) {
			playerEvents.emit( 'ready' );
		}
	}, [ loading ] );

	useEffect( () => {
		playerEvents.emit( 'slide-progress', currentSlideProgress, currentSlideIndex );
	}, [ currentSlideProgress ] );

	return html`
		<div class="wp-block-jetpack-story_container wp-story-container">
			${settings.renderers.renderHeader( html, {
				...settings.metadata,
				fullscreen,
				onExitFullscreen: () => setFullscreen( false ),
			} )}
			<ul class="wp-story-wrapper">
				${slides.map(
					( media, index ) => html`
						<${Slide}
							media=${media}
							index=${index}
							currentSlideIndex=${currentSlideIndex}
							playing=${currentSlideIndex === index && playing}
							muted=${muted}
							onProgress=${setCurrentSlideProgress}
							onLoaded=${() => index === 0 && setLoading( false )}
							onEnd=${tryNextSlide}
							settings=${settings}
						/>
					`
				)}
			</ul>
			${settings.renderers.renderOverlay( html, {
				playing,
				ended,
				tapToPlayPause: settings.tapToPlayPause,
				onClick: () => {
					if ( ! fullscreen && ! playing && settings.playInFullScreen ) {
						setFullscreen( true );
					}
					setPlaying( ! playing );
				},
				onPreviousSlide: tryPreviousSlide,
				onNextSlide: tryNextSlide,
			} )}
			<${ProgressBar}
				slides=${slides}
				fullscreen=${fullscreen}
				settings=${settings}
				currentSlideIndex=${currentSlideIndex}
				currentSlideProgress=${currentSlideProgress}
				onSlideSeek=${showSlide}
			/>
			${settings.renderers.renderControls( html, { playing, muted, setPlaying, setMuted } )}
		</div>
	`;
};

export const renderPlayer = ( container, settings ) => {
	render(
		html`
			<${Player} ...${settings} />
		`,
		container
	);
};
