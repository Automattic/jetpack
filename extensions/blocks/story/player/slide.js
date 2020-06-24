/**
 * External dependencies
 */
import { useEffect, useState, useRef } from 'preact/hooks';
import { html } from 'htm/preact';
import { waitMediaReady } from './utils';

export const Slide = ( {
	media,
	index,
	currentSlideIndex,
	playing,
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

	useEffect( () => {
		if ( isVideo() ) {
			if ( playing ) {
				mediaRef.current.play();
			} else {
				mediaRef.current.pause();
			}
		}
	}, [ playing ] );

	useEffect( () => {
		if ( isVideo() ) {
			mediaRef.current.muted = muted;
			if ( ! muted ) {
				mediaRef.current.volume = settings.volume;
			}
		}
	}, [ muted ] );

	useEffect( () => {
		if ( ! visible ) {
			updateProgressState( {
				currentTime: 0,
				duration: null,
				timeout: null,
			} );
			if ( isVideo() ) {
				mediaRef.current.pause();
				mediaRef.current.currentTime = 0;
			}
		}
	}, [ currentSlideIndex ] );

	useEffect( () => {
		clearTimeout( progressState.timeout );
		if ( playing ) {
			const video = isVideo() ? mediaRef.current : null;
			const duration = video ? video.duration : settings.imageTime;
			if ( progressState.currentTime >= duration ) {
				return;
			}
			progressState.timeout = setTimeout( () => {
				const currentTime = video
					? video.currentTime
					: progressState.currentTime + settings.renderInterval;
				updateProgressState( {
					...progressState,
					duration,
					currentTime,
				} );
			}, settings.renderInterval );
		}
	}, [ playing, progressState ] );

	useEffect( () => {
		if ( ! visible || progressState.duration === null ) {
			return;
		}
		const percentage = Math.round( ( 100 * progressState.currentTime ) / progressState.duration );
		if ( percentage >= 100 ) {
			onProgress( 100, {
				...progressState,
				currentTime: progressState.duration,
			} );
			onEnd();
		} else {
			onProgress( percentage, progressState );
		}
	}, [ progressState ] );

	useEffect( () => {
		waitMediaReady( mediaRef.current ).then( onLoaded );
	}, [] );

	return html`
		<li class="wp-story-slide" style=${{ display: visible ? 'block' : 'none' }}>
			${settings.renderers.renderMedia( html, {
				...media,
				index,
				mediaRef,
			} )}
		</li>
	`;
};

export default Slide;
