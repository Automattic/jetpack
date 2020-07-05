/**
 * External dependencies
 */
import { html } from 'htm/preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { render } from 'preact';
import { EventEmitter } from 'events';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Slide from './slide';
import ProgressBar from './progress-bar';
import Background from './components/background';

export const Player = ( { slides, playerEvents, ...settings } ) => {
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
			setCurrentSlideProgress( 100 );
			playerEvents.emit( 'end' );
			if ( settings.exitFullScreenOnEnd ) {
				setFullscreen( false );
			}
		}
	}, [ currentSlideIndex, slides ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( false );
		if ( settings.playInFullScreen ) {
			setPlaying( false );
		}
	}, [ fullscreen ] );

	useEffect( () => {
		playerEvents.emit( playing ? 'play' : 'pause' );
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
		<div
			class=${classNames( 'wp-story-container', {
				'wp-story-fullscreen': fullscreen,
				'wp-story-ended': ended,
			} )}
		>
			${settings.renderers.renderHeader( html, {
				...settings.metadata,
				fullscreen,
				onExitFullscreen,
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
							ended=${ended}
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
				tapToPlayPause: ! fullscreen && settings.tapToPlayPause,
				onClick: () => {
					if ( ! fullscreen && ! playing && settings.playInFullScreen ) {
						setFullscreen( true );
					}
					if ( ended && ! playing ) {
						showSlide( 0 );
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
		${fullscreen &&
			html`
				<${Background} currentMedia=${settings.blurredBackground && slides[ currentSlideIndex ]} />
			`}
	`;
};

export const renderPlayer = ( container, settings ) => {
	const playerEvents = new EventEmitter();

	render(
		html`
			<${Player} playerEvents=${playerEvents} ...${settings} />
		`,
		container
	);

	return playerEvents;
};
