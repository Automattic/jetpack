/**
 * External dependencies
 */
import { merge, range } from 'lodash';
import { EventEmitter } from 'events';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Internal dependencies
 */
import './player.scss';

const MOBILE_ASPECT_RATIO = 720 / 1280;
const SANITY_MAX_HEIGHT = 512; // 40% of 1280

const defaultSettings = {
	autoload: true,
	imageTime: 5000,
	renderInterval: 50,
	startMuted: true,
	playInFullScreen: true,
	pagination: {
		renderBullet,
	},
	callbacks: {
		renderPlayButton,
	},
};

export default function player( rootElement, params ) {
	const settings = merge( {}, defaultSettings, params );
	if ( typeof rootElement === 'string' ) {
		rootElement = document.querySelectorAll( rootElement );
	}

	const container = rootElement.querySelector( '.wp-story-container' );
	const slidesWrapper = container.querySelector( '.wp-story-wrapper' );
	const slides = [ ...slidesWrapper.querySelectorAll( 'li.wp-story-slide' ) ];

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
		} else {
			playerEvents.emit( 'end' );
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

	const goFullScreen = () => {
		document.body.classList.add( 'wp-story-in-fullscreen' );
		rootElement.classList.add( 'wp-story-fullscreen' );
	};

	const exitFullScreen = () => {
		document.body.classList.remove( 'wp-story-in-fullscreen' );
		rootElement.classList.remove( 'wp-story-fullscreen' );
	};

	const resize = () => {
		const slidesMaxHeight = slidesWrapper.offsetHeight;
		container.style.width = `${ MOBILE_ASPECT_RATIO * slidesMaxHeight }px`;
	};

	const initPlayer = () => {
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
					if ( settings.playInFullScreen ) {
						goFullScreen();
					}
					playCurrentSlide();
				} else {
					pauseCurrentSlide();
				}
			},
		} );

		// Everything not core to the player is handled as side-effect using events
		playerEvents.on( 'play', () => {
			rootElement.classList.remove( 'wp-story-paused' );
			rootElement.classList.add( 'wp-story-playing' );
			playButton.hide();
		} );
		playerEvents.on( 'pause', () => {
			rootElement.classList.remove( 'wp-story-playing' );
			rootElement.classList.add( 'wp-story-paused' );
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
		playerEvents.on( 'end', () => {} );
		playerEvents.on( 'ready', () => showSlide( 0, false ) );

		rootElement.classList.add( 'wp-story-initialized' );
		playerEvents.emit( 'init' );

		if ( slides.length > 0 ) {
			waitMediaReady( slides[ 0 ] ).then( () => {
				playerEvents.emit( 'ready' );
			} );

			let pendingRequestAnimationFrame = null;
			new ResizeObserver( () => {
				if ( pendingRequestAnimationFrame ) {
					cancelAnimationFrame( pendingRequestAnimationFrame );
					pendingRequestAnimationFrame = null;
				}
				pendingRequestAnimationFrame = requestAnimationFrame( () => {
					resize();
				} );
			} ).observe( container );
		}
	};

	if ( settings.autoload ) {
		initPlayer();
	}

	return {
		load: initPlayer,
		play: playCurrentSlide,
		pause: pauseCurrentSlide,
		goToSlide: showSlide,
		on: playerEvents.on.bind( playerEvents ),
	};
}

async function waitMediaReady( element ) {
	const mediaElements = [ ...element.querySelectorAll( 'img,video' ) ];
	return await Promise.all(
		mediaElements.map( mediaElement => {
			const elementTag = mediaElement.tagName.toLowerCase();
			if ( 'img' === elementTag ) {
				if ( mediaElement.complete ) {
					return;
				}
				return new Promise( resolve => {
					mediaElement.addEventListener( 'load', resolve, { once: true } );
				} );
			} else if ( 'video' === elementTag ) {
				if ( mediaElement.HAVE_ENOUGH_DATA === mediaElement.readyState ) {
					return;
				}
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
