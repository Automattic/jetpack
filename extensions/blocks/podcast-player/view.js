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

	player.mediaElement.media.addEventListener( 'play', handleMediaPlay );
	player.mediaElement.media.addEventListener( 'pause', handleMediaPause );
	player.mediaElement.media.addEventListener( 'error', handleMediaError );

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

function handleMediaPlay( e ) {
	const audioEl = e.detail.target;
	const parentBlockEl = audioEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! parentBlockEl ) {
		return;
	}

	// Clean up any error indication if present
	const episodeErrorEl = parentBlockEl.querySelector( '.podcast-player__episode-error' );
	if ( episodeErrorEl ) {
		parentBlockEl.classList.remove( 'is-error' );
		episodeErrorEl.remove();
	}

	parentBlockEl.classList.remove( 'is-paused' );
	parentBlockEl.classList.add( 'is-playing' );
}

function handleMediaPause( e ) {
	const audioEl = e.detail.target;
	const parentBlockEl = audioEl.closest( '.wp-block-jetpack-podcast-player' );

	parentBlockEl.classList.remove( 'is-playing' );
	parentBlockEl.classList.add( 'is-paused' );
}

function handleMediaError( e ) {
	const audioEl = e.detail.target;
	const parentBlockEl = audioEl.closest( '.wp-block-jetpack-podcast-player' );
	const activeEpisodeLinkEl = parentBlockEl.querySelector( '.is-active > a' );

	renderEpisodeError( activeEpisodeLinkEl );
}

const episodeLinkEls = document.querySelectorAll( '[data-jetpack-podcast-audio]' );

Array.prototype.forEach.call( episodeLinkEls, buildEpisodeLinkClickHandler );

function buildEpisodeLinkClickHandler( episodeLinkEl ) {
	episodeLinkEl.addEventListener( 'click', handleEpisodeLinkClick );
	episodeLinkEl.addEventListener( 'keydown', handleEpisodeLinkKeydown );
}

function handleEpisodeLinkKeydown( e ) {
	// we only need to track spacebar, as Enter is already handled by the browser since it's an `<a>` element
	if ( event.key === ' ' ) {
		handleEpisodeLinkClick( e );
	}
}

function handleEpisodeLinkClick( e ) {
	// Prevent handling clicks if a modifier is in use.
	if ( e.shiftKey || e.metaKey || e.altKey ) {
		return;
	}

	e.preventDefault();

	const episodeLinkEl = e.currentTarget;

	// Get clicked episode audio URL
	const audioUrl = episodeLinkEl.getAttribute( 'data-jetpack-podcast-audio' );
	if ( ! audioUrl ) {
		return renderEpisodeError( episodeLinkEl );
	}

	// Get clicked episode element
	const episodeEl = episodeLinkEl.closest( '.podcast-player__episode' );
	if ( ! episodeLinkEls ) {
		return renderEpisodeError( episodeLinkEl );
	}

	// Get episode's parent block element
	const blockEl = episodeEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! blockEl ) {
		return renderEpisodeError( episodeLinkEl );
	}

	// Get player instance by block id
	const player = playerInstances[ blockEl.id ];
	if ( ! player ) {
		return renderEpisodeError( episodeLinkEl );
	}

	player.audio.pause();

	const activeEpisodeEl = blockEl.querySelector( '.is-active' );

	if ( activeEpisodeEl ) {
		activeEpisodeEl.classList.remove( 'is-active' );
		activeEpisodeEl
			.querySelector( '[aria-pressed="true"]' )
			.setAttribute( 'aria-pressed', 'false' );
	}

	player.audio.src = audioUrl;

	player.audio.play().catch( function() {
		renderEpisodeError( episodeLinkEl );
	} );

	episodeEl.classList.add( 'is-active' );
	episodeLinkEl.setAttribute( 'aria-pressed', 'true' );
}

function renderEpisodeError( episodeLinkEl ) {
	if ( ! episodeLinkEl ) {
		return;
	}

	// Find parent block element
	const parentBlockEl = episodeLinkEl.closest( '.wp-block-jetpack-podcast-player' );
	if ( ! parentBlockEl ) {
		return;
	}

	parentBlockEl.classList.remove( 'is-playing', 'is-paused' );
	parentBlockEl.classList.add( 'is-error' );

	// Don't render if already rendered
	if ( parentBlockEl.querySelector( '.podcast-player__episode-error' ) ) {
		return;
	}

	// Get parent episode element
	const parentEpisodeEl = episodeLinkEl.closest( '.podcast-player__episode' );
	if ( ! parentEpisodeEl ) {
		return;
	}

	const errorTemplate = `
		<div class="podcast-player__episode-error">
			Episode unavailable <span>(<a href="{{episodeUrl}}" rel="noopener noreferrer nofollow" target="_blank">Open in new tab</a>)</span>
		</div>
	`;

	// Compile error template and create the element
	const compiledTemplate = errorTemplate.replace( '{{episodeUrl}}', episodeLinkEl.href );
	const errorEl = createElementFromString( compiledTemplate );

	// Render the element
	parentEpisodeEl.appendChild( errorEl );
}

function createElementFromString( html ) {
	if ( ! html ) {
		return;
	}

	return new DOMParser().parseFromString( html, 'text/html' ).body.firstChild;
}
