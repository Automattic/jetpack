/* global _wpmejsSettings, MediaElementPlayer, jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';

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
	player.audio.src = block
		.querySelector( '[data-jetpack-podcast-audio]' )
		.getAttribute( 'data-jetpack-podcast-audio' );
	block.insertBefore( player.audio, block.firstChild );
	player.mediaElement = new MediaElementPlayer( player.audio, meJsSettings );

	player.mediaElement.media.addEventListener( 'play', function() {
		handlePlay( getActiveEpisodeEl() );
	} );
	player.mediaElement.media.addEventListener( 'pause', function() {
		handlePause( getActiveEpisodeEl() );
	} );
	player.mediaElement.media.addEventListener( 'error', function() {
		handleError( getActiveEpisodeEl() );
	} );

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

function handleEpisodeLinkClick( episodeLinkEl ) {
	// Get clicked episode element
	const episodeEl = episodeLinkEl.closest( '.podcast-player__episode' );
	if ( ! episodeEl ) {
		// Append the error to closest parent if episode element is not present.
		return renderEpisodeError( episodeLinkEl.closest( '*' ) );
	}

	// Get clicked episode audio URL
	const audioUrl = episodeLinkEl.getAttribute( 'data-jetpack-podcast-audio' );
	if ( ! audioUrl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get player instance by block id
	const player = playerInstances[ blockEl.id ];
	if ( ! player ) {
		return renderEpisodeError( episodeEl );
	}

	// Get currently active episode element
	const activeEpisodeEl = document.querySelector( '.podcast-player__episode.is-active' );
	if ( activeEpisodeEl ) {
		if ( activeEpisodeEl.isSameNode( episodeEl ) ) {
			if ( player.audio.paused ) {
				player.audio.play();
				handlePlay( activeEpisodeEl );
			} else {
				player.audio.pause();
				handlePause( activeEpisodeEl );
			}
			return;
		}
		// Make episode inactive
		activeEpisodeEl.classList.remove( 'is-active' );
		activeEpisodeEl
			.querySelector( '[aria-pressed="true"]' )
			.setAttribute( 'aria-pressed', 'false' );

		handlePause( activeEpisodeEl );
	}

	player.audio.src = audioUrl;

	player.audio
		.play()
		.then( () => handlePlay( episodeEl ) )
		.catch( () => handleError( episodeEl ) );
}

function renderEpisodeError( episodeEl ) {
	const parentBlockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );

	// Don't render if already rendered
	if ( parentBlockEl.querySelector( '.podcast-player__episode-error' ) ) {
		return;
	}

	const episodeLinkEl = episodeEl.querySelector( '.podcast-player__episode-link' );

	// ToDo: make error template translatable
	const errorTemplate = `
		<div class="podcast-player__episode-error">
			Episode unavailable <span>(<a href="{{episodeUrl}}" rel="noopener noreferrer nofollow" target="_blank">Open in new tab</a>)</span>
		</div>
	`;

	// Compile error template and create the element
	const compiledTemplate = errorTemplate.replace( '{{episodeUrl}}', episodeLinkEl.href );
	const errorEl = new DOMParser().parseFromString( compiledTemplate, 'text/html' ).body.firstChild;

	// Render the element
	episodeEl.appendChild( errorEl );
}

function handlePlay( episodeEl ) {
	if ( ! episodeEl ) {
		return;
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get episode's link element
	const episodeLinkEl = episodeEl.querySelector( '.podcast-player__episode-link' );
	if ( ! episodeLinkEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get episode's state icon container element
	const iconContainerEl = episodeEl.querySelector( '.podcast-player__episode-status-icon' );
	if ( ! iconContainerEl ) {
		return renderEpisodeError( episodeEl );
	}

	blockEl.classList.remove( 'is-paused', 'is-error' );
	blockEl.classList.add( 'is-playing' );
	iconContainerEl.innerHTML =
		'<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/></svg>';
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
		return renderEpisodeError( episodeEl );
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
	iconContainerEl.innerHTML =
		'<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';
	episodeEl.classList.add( 'is-active' );
	episodeLinkEl.setAttribute( 'aria-pressed', 'true' );
	renderEpisodeError( episodeEl );
}

function getActiveEpisodeEl() {
	return document.querySelector( '.podcast-player__episode.is-active' );
}
