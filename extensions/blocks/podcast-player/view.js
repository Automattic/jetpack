/* global _wpmejsSettings, MediaElementPlayer, jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';

const playerInstances = {};
const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

const initializeBlock = function( id ) {
	const block = document.getElementById( id );

	// Check if we can find the block and required dependency.
	if ( ! block || ! MediaElementPlayer ) {
		return;
	}

	// Create player instance.
	const player = {
		id,
		block,
		currentTrack: 0,
		tracks: [],
		attributes: {},
	};

	// Load data from the embedded JSON.
	const dataContainer = block.querySelector( 'script[type="application/json"]' );
	if ( dataContainer ) {
		try {
			const data = JSON.parse( dataContainer.text );
			player.tracks = data.tracks;
			player.attributes = data.attributes;
		} catch ( e ) {
			return;
		}
	}

	if ( ! player.tracks.length ) {
		return;
	}

	// Initialize player UI.
	player.audio = document.createElement( 'audio' );
	player.audio.src = player.tracks[ 0 ].src;
	block.insertBefore( player.audio, block.firstChild );
	player.mediaElement = new MediaElementPlayer( player.audio, meJsSettings );

	// Save instance to the list of active ones.
	playerInstances[ id ] = player;
};

// Initialize queued players.
if ( window.jetpackPodcastPlayers !== undefined ) {
	jetpackPodcastPlayers.forEach( initializeBlock );
}

// Replace the queue with an immediate initialization for async loaded players.
window.jetpackPodcastPlayers = {
	push: initializeBlock,
};

function createSVGs() {
	const svgTemplate = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svgTemplate.classList.add( 'podcast-player-icons' );
	svgTemplate.setAttribute( 'style', 'position: absolute; width: 0; height: 0; overflow: hidden;' );
	svgTemplate.setAttribute( 'version', '1.1' );
	svgTemplate.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
	svgTemplate.setAttribute( 'xmlns:xlink', 'http://www.w3.org/1999/xlink' );

	const soundIcon = `<symbol id="podcast-player-icon__sound" viewBox="0 0 24 24"><title id="podcast-player-icon__sound-title">${ __(
		'Playing'
	) }</title><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/></symbol>`;
	const errorIcon = `<symbol id="podcast-player-icon__error" viewBox="0 0 24 24"><title id="podcast-player-icon__error-title">${ __(
		'Error'
	) }</title><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></symbol>`;
	svgTemplate.innerHTML = `<defs>${ soundIcon }${ errorIcon }</defs>`;
	// put it in the body
	document.body.appendChild( svgTemplate );
}

createSVGs();

function handleEpisodeLinkKeydown( e ) {
	// early return as quickly as possible to prevent potential performance issues.
	// we only care about the spacebar
	if ( event.key !== ' ' || ! e.target.classList.contains( 'podcast-player__episode-link' ) ) {
		return;
	}

	e.stopPropagation();

	handleEpisodeLinkEvent( e );
}

function handleEpisodeLinkEvent( e ) {
	const episodeLinkEl = e.target.closest( '[data-jetpack-podcast-audio]' );

	if ( episodeLinkEl ) {
		// Prevent handling clicks if a modifier is in use.
		if ( e.shiftKey || e.metaKey || e.altKey ) {
			return;
		}

		e.preventDefault();
		handleEpisodeLinkClick( episodeLinkEl );
	}
}

// Add document event listeners
document.addEventListener( 'click', handleEpisodeLinkEvent );
document.addEventListener( 'keydown', handleEpisodeLinkKeydown );

async function handleEpisodeLinkClick( episodeLinkEl ) {
	// Get clicked episode element
	const episodeEl = episodeLinkEl.closest( '.podcast-player__episode' );
	if ( ! episodeEl ) {
		// Append the error to closest parent if episode element is not present.
		return handleError( episodeLinkEl.parentNode );
	}

	// Get clicked episode audio URL
	const audioUrl = episodeLinkEl.getAttribute( 'data-jetpack-podcast-audio' );
	if ( ! audioUrl ) {
		return handleError( episodeEl );
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return handleError( episodeEl );
	}

	// Get player instance by block id
	const player = playerInstances[ blockEl.id ];
	if ( ! player ) {
		return handleError( episodeEl );
	}

	// Get currently active episode element
	const activeEpisodeEl = blockEl.querySelector( '.podcast-player__episode.is-active' );

	if ( activeEpisodeEl && activeEpisodeEl.isSameNode( episodeEl ) ) {
		if ( player.audio.paused ) {
			try {
				await player.audio.play();
			} catch ( _error ) {
				return handleError( episodeEl );
			}
			handlePlay( episodeEl );
		} else {
			player.audio.pause();
			handlePause( activeEpisodeEl );
		}
	} else {
		if ( activeEpisodeEl ) {
			// Make episode inactive
			activeEpisodeEl.classList.remove( 'is-active' );
			activeEpisodeEl
				.querySelector( '[aria-pressed="true"]' )
				.setAttribute( 'aria-pressed', 'false' );

			handlePause( activeEpisodeEl );
		}

		player.audio.src = audioUrl;

		try {
			await player.audio.play();
		} catch ( _error ) {
			return handleError( episodeEl );
		}

		handlePlay( episodeEl );
	}
}

function renderEpisodeError( episodeEl ) {
	const parentBlockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );

	// Don't render if already rendered
	if ( parentBlockEl.querySelector( '.podcast-player__episode-error' ) ) {
		return;
	}

	const episodeLinkEl = episodeEl.querySelector( '.podcast-player__episode-link' );

	const linkEl = document.createElement( 'a' );
	linkEl.rel = 'noopener noreferrer nofollow';
	linkEl.target = '_blank';
	linkEl.href = episodeLinkEl.href;
	linkEl.innerText = __( 'Open in a new tab', 'jetpack' );

	const spanEl = document.createElement( 'span' );
	spanEl.appendChild( new Text( '(' ) );
	spanEl.appendChild( linkEl );
	spanEl.appendChild( new Text( ')' ) );

	const errorEl = document.createElement( 'div' );
	errorEl.classList.add( 'podcast-player__episode-error' );
	errorEl.appendChild( new Text( __( 'Episode unavailable', 'jetpack' ) + ' ' ) );
	errorEl.appendChild( spanEl );

	// Render the element
	episodeEl.appendChild( errorEl );
}

function handlePlay( episodeEl ) {
	if ( ! episodeEl ) {
		return;
	}

	// Check if there's any other episode playing and pause it.
	const playingEpisodeEl = document.querySelector(
		'.wp-block-jetpack-podcast-player.is-playing .podcast-player__episode.is-active'
	);
	if ( playingEpisodeEl ) {
		handlePause( playingEpisodeEl );
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return handleError( episodeEl );
	}

	// Get episode's link element
	const episodeLinkEl = episodeEl.querySelector( '.podcast-player__episode-link' );
	if ( ! episodeLinkEl ) {
		return handleError( episodeEl );
	}

	// Get episode's state icon container element
	const iconContainerEl = episodeEl.querySelector( '.podcast-player__episode-status-icon' );
	if ( ! iconContainerEl ) {
		return handleError( episodeEl );
	}

	blockEl.classList.remove( 'is-paused', 'is-error' );
	blockEl.classList.add( 'is-playing' );
	iconContainerEl.innerHTML = getSoundIconHTML();
	episodeEl.classList.add( 'is-active' );
	episodeLinkEl.setAttribute( 'aria-pressed', 'true' );
}

function handlePause( episodeEl ) {
	if ( ! episodeEl ) {
		return;
	}

	// Get episode's parent block
	const episodeBlockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! episodeBlockEl ) {
		return handleError( episodeEl );
	}

	// Set parent block classes
	episodeBlockEl.classList.remove( 'is-playing' );
	episodeBlockEl.classList.add( 'is-paused' );

	// Remove the episode state icon
	episodeEl.querySelector( '.podcast-player__episode-status-icon' ).innerHTML = '';
}

function handleError( episodeEl ) {
	if ( ! episodeEl ) {
		return;
	}

	// Get episode's link element
	const episodeLinkEl = episodeEl.querySelector( '.podcast-player__episode-link' );
	if ( ! episodeLinkEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get episode's state icon container element
	const iconContainerEl = episodeEl.querySelector( '.podcast-player__episode-status-icon' );
	if ( ! iconContainerEl ) {
		return renderEpisodeError( episodeEl );
	}

	blockEl.classList.remove( 'is-playing', 'is-paused' );
	blockEl.classList.add( 'is-error' );
	iconContainerEl.innerHTML = getErrorIconHTML();
	episodeEl.classList.add( 'is-active' );
	episodeLinkEl.setAttribute( 'aria-pressed', 'true' );
	renderEpisodeError( episodeEl );
}

function getSoundIconHTML() {
	return '<svg aria-labelledby="podcast-player-icon__sound-title"><use xlink:href="#podcast-player-icon__sound" /></svg>';
}

function getErrorIconHTML() {
	return '<svg aria-labelledby="podcast-player-icon__error-title"><use xlink:href="#podcast-player-icon__error" /></svg>';
}
