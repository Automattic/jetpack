/**
 * External dependencies
 */
import { merge, range } from 'lodash';
import { EventEmitter } from 'events';

/**
 * Internal dependencies
 */
import './player.scss';

const defaultSettings = {
	imageTime: 5000,
	renderInterval: 50,
	startMuted: true,
	playInFullScreen: false,
	pagination: {
		renderBullet,
	},
	callbacks: {
		renderPlayButton,
	},
};

export default function player( container, params ) {
	const settings = merge( {}, defaultSettings, params );
	if ( typeof container === 'string' ) {
		container = document.querySelector( container );
	}

	const slides = [ ...container.querySelectorAll( 'li.wp-story-slide' ) ];
	const currentSlideStatus = {
		currentTime: 0,
		duration: null,
		timeout: null,
	};
	let currentSlideIndex = 0;
	let playing = false;

	const playerEvents = new EventEmitter();
	playerEvents.on( 'play', () => ( playing = true ) );
	playerEvents.on( 'pause', () => ( playing = false ) );
	playerEvents.on( 'end', () => ( playing = false ) );

	const resetCurrentSlideStatus = () => {
		clearTimeout( currentSlideStatus.timeout );
		currentSlideStatus.timeout = null;
		currentSlideStatus.currentTime = 0;
		currentSlideStatus.duration = null;
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		if ( video ) {
			video.currentTime = 0;
		}
	};

	const showSlide = ( slideIndex, play = true ) => {
		currentSlideIndex = slideIndex;

		slides.forEach( ( slide, index ) => {
			if ( index !== slideIndex ) {
				slide.style.display = 'none';
			}
		} );
		slides[ slideIndex ].style.display = 'block';

		resetCurrentSlideStatus();
		playerEvents.emit( 'seek', slideIndex );

		if ( play ) {
			playing = false;
			// eslint-disable-next-line no-use-before-define
			playCurrentSlide();
		}
	};

	const tryNextSlide = () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			showSlide( currentSlideIndex + 1 );
		}
	};

	const trackCurrentSlideProgress = onComplete => {
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		currentSlideStatus.duration = video ? video.duration : settings.imageTime;
		const trackProgress = () => {
			const percentage = Math.round(
				( 100 * currentSlideStatus.currentTime ) / currentSlideStatus.duration
			);
			if ( currentSlideStatus.currentTime >= currentSlideStatus.duration ) {
				playerEvents.emit( 'slide-progress', 100, currentSlideStatus );
				clearTimeout( currentSlideStatus.timeout );
				onComplete();
				return;
			}
			if ( video ) {
				currentSlideStatus.currentTime = video.currentTime;
			} else {
				currentSlideStatus.currentTime += settings.renderInterval;
			}
			playerEvents.emit( 'slide-progress', percentage, currentSlideStatus );
			currentSlideStatus.timeout = setTimeout( trackProgress, settings.renderInterval );
		};
		trackProgress();
	};

	const playCurrentSlide = () => {
		if ( playing ) {
			return;
		}
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		if ( video ) {
			if ( ! video.getAttribute( 'wp-story-attached' ) ) {
				video.setAttribute( 'wp-story-attached', 'true' );
				video.muted = settings.startMuted;
			}
			video.play();
		}
		trackCurrentSlideProgress( tryNextSlide );
		playerEvents.emit( 'play' );
	};

	const pauseCurrentSlide = () => {
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		if ( video ) {
			video.pause();
		}
		clearTimeout( currentSlideStatus.timeout );
		playerEvents.emit( 'pause' );
	};

	const initPlayer = () => {
		if ( slides.length > 0 ) {
			container.style.display = 'block';
			container.style.opacity = 1;
			waitMediaReady( slides[ 0 ] ).then( () => {
				container.classList.add( 'wp-story-initialized' );
				playerEvents.emit( 'ready' );
			} );
		}

		// show progress
		const paginationElement = container.querySelector( '.wp-story-pagination' );
		paginationElement.classList.add( 'wp-story-pagination-bullets' );
		const bullets = slides.map( ( slide, index ) => {
			return settings.pagination.renderBullet( paginationElement, {
				index,
				onClick: () => showSlide( index ),
			} );
		} );

		// show play pause button
		const playButton = settings.callbacks.renderPlayButton( container, {
			onClick: () => {
				if ( ! playing ) {
					playCurrentSlide();
				} else {
					pauseCurrentSlide();
				}
			},
		} );

		// Everything not core to the player is handled as side-effect using events
		playerEvents.on( 'play', () => {
			container.classList.remove( 'wp-story-paused' );
			container.classList.add( 'wp-story-playing' );
			playButton.hide();
		} );
		playerEvents.on( 'pause', () => {
			container.classList.remove( 'wp-story-playing' );
			container.classList.add( 'wp-story-paused' );
			playButton.show();
		} );
		playerEvents.on( 'slide-progress', percentage => {
			if ( bullets[ currentSlideIndex ] ) {
				bullets[ currentSlideIndex ].setProgress( percentage );
			}
		} );
		playerEvents.on( 'seek', slideIndex => {
			bullets.slice( 0, slideIndex ).forEach( bullet => {
				bullet.setProgress( 100 );
			} );
			bullets.slice( slideIndex, slides.length ).forEach( bullet => {
				bullet.setProgress( 0 );
			} );
		} );
		playerEvents.emit( 'init' );
		playerEvents.on( 'ready', () => showSlide( 0, false ) );

		return {
			play: playCurrentSlide,
			pause: pauseCurrentSlide,
			goToSlide: showSlide,
			on: playerEvents.on.bind( playerEvents ),
		};
	};

	return initPlayer();
}

async function waitMediaReady( element ) {
	const mediaElements = [ ...element.querySelectorAll( 'img,video' ) ];
	return await Promise.all(
		mediaElements.map( mediaElement => {
			const elementTag = mediaElement.tagName.toLowerCase();
			if ( 'img' === mediaElement.tagName.toLowerCase() ) {
				if ( mediaElement.complete ) {
					return;
				}
				return new Promise( resolve => {
					mediaElement.addEventListener( 'load', resolve, { once: true } );
				} );
			} else if ( 'video' === elementTag ) {
				return new Promise( resolve => {
					mediaElement.addEventListener( 'canplaythrough', resolve, { once: true } );
				} );
			}
		} )
	);
}

function renderPlayButton( container, { onClick } ) {
	const playOverlay = htmlToElement( `
		<div class="wp-story-overlay mejs-overlay mejs-layer mejs-overlay-play">
			<div class="wp-story-button-play mejs-overlay-button"
				role="button"
				tabIndex="0"
				aria-label="Play"
				aria-pressed="false">
			</div>
		</div>
	` );
	const playButton = playOverlay.children[ 0 ];
	const showPlayButton = () => {
		playButton.style.display = 'block';
	};
	const hidePlayButton = () => {
		playButton.style.display = 'none';
	};
	playOverlay.addEventListener( 'click', onClick, false );
	container.appendChild( playOverlay );
	return {
		show: showPlayButton,
		hide: hidePlayButton,
	};
}

function renderBullet( container, { index, onClick } ) {
	const bulletElement = htmlToElement( `
		<button class="wp-story-pagination-bullet" role="button" aria-label="Go to slide ${ index }">
			<div class="wp-story-pagination-bullet-bar">
				<div class="wp-story-pagination-bullet-bar-progress"></div>
			</div>
		</button>
	` );
	bulletElement.addEventListener( 'click', onClick, false );
	container.appendChild( bulletElement );
	const progressBar = bulletElement.querySelector( '.wp-story-pagination-bullet-bar-progress' );
	return {
		setProgress: percentage => {
			progressBar.style.width = `${ percentage }%`;
		},
	};
}

function htmlToElement( html ) {
	const template = document.createElement( 'template' );
	template.innerHTML = html.trim();
	return template.content.firstChild;
}
