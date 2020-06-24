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

export const playerEvents = new EventEmitter();

export const Player = ( { slides, settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ fullscreen, setFullscreen ] = useState( false );
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

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			showSlide( currentSlideIndex + 1 );
		} else {
			setPlaying( false );
		}
	}, [ currentSlideIndex, slides ] );

	useEffect( () => {
		playerEvents.emit( playing ? 'play' : 'pause' );
	}, [ playing ] );

	useEffect( () => {
		playerEvents.emit( muted ? 'mute' : 'unmute' );
	}, [ muted ] );

	useEffect( () => {
		playerEvents.emit( fullscreen ? 'go-fullscreen' : 'exit-fullscreen' );
	}, [ fullscreen ] );

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
			class="wp-block-jetpack-story_container wp-story-container"
			style=${{ display: loading ? 'none' : 'block', opacity: 1 }}
		>
			${settings.renderers.renderHeader( html )}
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
				onClick: () => {
					if ( ! fullscreen && ! playing && settings.playInFullScreen ) {
						setFullscreen( true );
					}
					setPlaying( ! playing );
				},
			} )}
			<div class="wp-story-pagination wp-story-pagination-bullets">
				${slides.map( ( slide, index ) => {
					let progress;
					if ( index < currentSlideIndex ) {
						progress = 100;
					} else if ( index > currentSlideIndex ) {
						progress = 0;
					} else {
						progress = currentSlideProgress;
					}
					return settings.renderers.renderBullet( html, {
						index,
						progress,
						onClick: useCallback( () => showSlide( index ), [ index ] ),
					} );
				} )}
			</div>
			${settings.renderers.renderControls( html, { playing, muted, setPlaying, setMuted } )}
		</div>
	`;
};

export const renderPlayer = ( container, slides, settings ) => {
	render(
		html`
			<${Player} slides=${slides} settings=${settings} />
		`,
		container
	);
};
