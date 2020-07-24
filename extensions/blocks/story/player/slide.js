/**
 * External dependencies
 */
import waitMediaReady from './lib/wait-media-ready';

/**
 * WordPress dependencies
 */
import { createElement, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Media } from './components';

export const Slide = ( {
	media,
	index,
	currentSlideIndex,
	playing,
	ended,
	muted,
	onEnd,
	onProgress,
	onLoaded,
	settings,
} ) => {
	const visible = index === currentSlideIndex;
	const mediaRef = useRef( null );
	const isVideo = () => mediaRef.current.tagName.toLowerCase() === 'video';

	const [ progressState, updateProgressState ] = useState( {
		currentTime: 0,
		duration: null,
		timeout: null,
	} );

	// Sync playing state with underlying HTMLMediaElement
	useEffect( () => {
		if ( isVideo() ) {
			if ( playing ) {
				mediaRef.current.play();
			} else {
				mediaRef.current.pause();
			}
		}
	}, [ playing ] );

	// Display end of video on last slide when story ends
	useEffect( () => {
		if ( isVideo() && ended && visible ) {
			mediaRef.current.currentTime = mediaRef.current.duration;
		}
	}, [ ended, visible ] );

	// Sync muted state with underlying HTMLMediaElement
	useEffect( () => {
		if ( isVideo() ) {
			mediaRef.current.muted = muted;
			if ( ! muted ) {
				mediaRef.current.volume = settings.volume;
			}
		}
	}, [ muted ] );

	// Reset progress state for slides that aren't being displayed
	useEffect( () => {
		if ( ! visible ) {
			updateProgressState( {
				currentTime: 0,
				duration: null,
				timeout: null,
				lastUpdate: null,
			} );
			if ( isVideo() ) {
				mediaRef.current.pause();
				mediaRef.current.currentTime = 0;
			}
		}
	}, [ visible ] );

	// Reset progress on replay for stories with one slide
	useEffect( () => {
		if ( playing && ended && currentSlideIndex === index ) {
			updateProgressState( {
				currentTime: 0,
				duration: null,
				timeout: null,
				lastUpdate: null,
			} );
			if ( isVideo() ) {
				mediaRef.current.currentTime = 0;
			}
		}
	}, [ playing, ended, currentSlideIndex ] );

	// Sync progressState with underlying media playback progress
	useEffect( () => {
		clearTimeout( progressState.timeout );
		if ( playing ) {
			const video = isVideo() ? mediaRef.current : null;
			const duration = video ? video.duration : settings.imageTime;
			if ( progressState.currentTime >= duration ) {
				return;
			}
			progressState.timeout = setTimeout( () => {
				const delta = progressState.lastUpdate
					? Date.now() - progressState.lastUpdate
					: settings.renderInterval;
				const currentTime = video ? video.currentTime : progressState.currentTime + delta;
				updateProgressState( {
					...progressState,
					lastUpdate: Date.now(),
					duration,
					currentTime,
				} );
			}, settings.renderInterval );
		}
		const paused = visible && ! playing;
		if ( paused && progressState.lastUpdate ) {
			updateProgressState( {
				...progressState,
				lastUpdate: null,
			} );
		}
	}, [ playing, progressState ] );

	// Watch progressState and trigger events using onProgress and onEnd callbacks
	useEffect( () => {
		if ( ! playing || ended || progressState.duration === null ) {
			return;
		}
		const percentage = Math.round( ( 100 * progressState.currentTime ) / progressState.duration );
		if ( percentage >= 100 ) {
			onProgress( 100 );
			onEnd();
		} else {
			onProgress( percentage );
		}
	}, [ playing, progressState ] );

	// Calls onLoaded when underlying media is ready to be played
	useEffect( () => {
		waitMediaReady( mediaRef.current ).then( onLoaded );
	}, [ media ] );

	return (
		<li className="wp-story-slide" style={ { display: visible ? 'block' : 'none' } }>
			<Media { ...media } index={ index } mediaRef={ mediaRef } />
		</li>
	);
};

export default Slide;
