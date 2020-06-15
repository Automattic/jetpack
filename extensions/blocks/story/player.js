/**
 * External dependencies
 */
import { merge } from 'lodash';

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
		elapsed: 0,
		started: null,
		timeout: null,
	};
	let currentSlideIndex = 0;
	let playing = false;

	const resetCurrentSlideStatus = () => {
		currentSlideStatus.elapsed = 0;
		currentSlideStatus.started = false;
		clearTimeout( currentSlideStatus.timeout );
		currentSlideStatus.timeout = null;
	};

	const showSlide = ( slideIndex, play = false ) => {
		resetCurrentSlideStatus();
		slides.forEach( ( slide, index ) => {
			if ( index !== slideIndex ) {
				slide.style.display = 'none';
			}
		} );
		slides[ slideIndex ].style.display = 'block';
		if ( play ) {
			// eslint-disable-next-line no-use-before-define
			playCurrentSlide();
		}
	};

	const tryNextSlide = () => {
		const playNextSlide = playing;
		playing = false;
		if ( currentSlideIndex < slides.length - 1 ) {
			currentSlideIndex++;
			showSlide( currentSlideIndex, playNextSlide );
		}
	};

	const updateProgress = event => {
		const percentage = Math.round( ( 100 * event.target.currentTime ) / event.target.duration );
		const bullet = container.querySelector(
			`.wp-story-pagination-bullets > .wp-story-pagination-bullet:nth-child(${ currentSlideIndex +
				1 })`
		);
		bullet.querySelector(
			'.wp-story-pagination-bullet-bar-progress'
		).style.width = `${ percentage }%`;
	};

	const playCurrentSlide = () => {
		if ( playing ) {
			return;
		}
		playing = true;
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		if ( ! video ) {
			currentSlideStatus.started = Date.now();
			currentSlideStatus.interval = setInterval( () => {
				currentSlideStatus.elapsed += settings.renderInterval;
				if ( currentSlideStatus.elapsed >= settings.imageTime ) {
					clearInterval( currentSlideStatus.interval );
					tryNextSlide();
					return;
				}
				updateProgress( {
					target: {
						duration: settings.imageTime,
						currentTime: currentSlideStatus.elapsed,
					},
				} );
			}, settings.renderInterval );
			//currentSlideStatus.timeout = setTimeout( tryNextSlide, settings.imageTime - currentSlideStatus.elapsed );
			return;
		}
		if ( ! video.getAttribute( 'attached' ) ) {
			video.addEventListener( 'timeupdate', updateProgress, false );
			video.addEventListener( 'ended', tryNextSlide, false );
			video.muted = settings.startMuted;
			video.setAttribute( 'attached', true );
		}
		video.play();
	};

	const pauseCurrentSlide = () => {
		if ( ! playing ) {
			return;
		}
		playing = false;
		const slideElement = slides[ currentSlideIndex ];
		const video = slideElement.querySelector( 'video' );
		if ( video ) {
			video.pause();
		} else {
			clearInterval( currentSlideStatus.interval );
			currentSlideStatus.interval = null;
		}
	};

	const initPlayer = () => {
		if ( slides.length > 0 ) {
			container.style.display = 'block';
			container.style.opacity = 1;
			waitMediaReady( slides[ 0 ] ).then( () => {
				container.classList.add( 'wp-story-initialized' );
				showSlide( 0 );
			} );
		}
		// show progress
		const paginationElement = container.querySelector( '.wp-story-pagination' );
		paginationElement.classList.add( 'wp-story-pagination-bullets' );
		slides.forEach( ( slide, index ) => {
			const bulletElement = settings.pagination.renderBullet( {
				index,
				onClick: () => showSlide( index ),
			} );
			paginationElement.appendChild( bulletElement );
		} );
		// show play pause button
		const playButton = settings.callbacks.renderPlayButton( {
			onClick: () => {
				if ( ! playing ) {
					playCurrentSlide();
				} else {
					pauseCurrentSlide();
				}
			},
		} );
		playButton.classList.add( 'wp-story-overlay' );
		container.appendChild( playButton );
	};

	initPlayer();

	return {
		play: playCurrentSlide,
		pause: pauseCurrentSlide,
		goToSlide: showSlide,
	};
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

function renderPlayButton( { onClick } ) {
	const playOverlay = htmlToElement( `
		<div class="wp-story-overlay-play mejs-overlay mejs-layer mejs-overlay-play">
			<div class="wp-story-button-play mejs-overlay-button"
				role="button"
				tabIndex="0"
				aria-label="Play"
				aria-pressed="false">
			</div>
		</div>
	` );
	playOverlay.addEventListener(
		'click',
		event => {
			const playButton = playOverlay.children[ 0 ];
			playButton.style.display = playButton.style.display === 'none' ? 'block' : 'none';
			onClick( event );
		},
		false
	);
	return playOverlay;
}

function renderBullet( { index, onClick } ) {
	const bulletElement = htmlToElement( `
		<button class="wp-story-pagination-bullet" role="button" aria-label="Go to slide ${ index }">
			<div class="wp-story-pagination-bullet-bar">
				<div class="wp-story-pagination-bullet-bar-progress"></div>
			</div>
		</button>
	` );
	bulletElement.addEventListener( 'click', onClick, false );
	return bulletElement;
}

function htmlToElement( html ) {
	const template = document.createElement( 'template' );
	template.innerHTML = html.trim();
	return template.content.firstChild;
}
