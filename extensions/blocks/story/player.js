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
		renderBullets,
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

	const showSlide = slideIndex => {
		resetCurrentSlideStatus();
		slides.forEach( ( slide, index ) => {
			if ( index !== slideIndex ) {
				slide.style.display = 'none';
			}
		} );
		slides[ slideIndex ].style.display = 'block';
		if ( playing ) {
			// eslint-disable-next-line no-use-before-define
			playCurrentSlide();
		}
	};

	const tryNextSlide = () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			currentSlideIndex++;
			showSlide( currentSlideIndex );
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
		video.addEventListener( 'timeupdate', updateProgress, false );
		video.addEventListener( 'ended', tryNextSlide, false );
		video.muted = settings.startMuted;
		video.play();
	};

	const pauseCurrentSlide = () => {
		if ( ! playing ) {
			return;
		}
		playing = false;
		//clearTimeout( currentSlideStatus.timeout );
		clearInterval( currentSlideStatus.interval );
		currentSlideStatus.timeout = null;
		currentSlideStatus.interval = null;
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
			const bulletElement = htmlToElement( settings.pagination.renderBullets( index ) );
			paginationElement.appendChild( bulletElement );
			bulletElement.addEventListener( 'click', () => showSlide( index ), false );
		} );
		// show play pause button
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

function renderBullets( index ) {
	return `
		<button class="wp-story-pagination-bullet" role="button" aria-label="Go to slide ${ index }">
			<div class="wp-story-pagination-bullet-bar">
				<div class="wp-story-pagination-bullet-bar-progress"></div>
			</div>
		</button>
	`;
}

function htmlToElement( html ) {
	const template = document.createElement( 'template' );
	template.innerHTML = html.trim();
	return template.content.firstChild;
}
