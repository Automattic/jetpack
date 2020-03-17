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

const episodeLinkEls = document.querySelectorAll( '[data-jetpack-podcast-audio]' );

Array.prototype.forEach.call( episodeLinkEls, buildEpisodeLinkClickHandler );

function buildEpisodeLinkClickHandler( episodeLinkEl ) {
	episodeLinkEl.addEventListener( 'keydown', handleEpisodeLinkKeydown );
}

function handleEpisodeLinkKeydown( e ) {
	// we only need to track spacebar, as Enter is already handled by the browser since it's an `<a>` element
	if ( event.key === ' ' ) {
		handleEpisodeLinkClick( e );
	}
}

document.addEventListener( 'click', function( e ) {
	const episodeLinkEl = e.target.closest( '[data-jetpack-podcast-audio]' );

	if ( episodeLinkEl ) {
		// Prevent handling clicks if a modifier is in use.
		if ( e.shiftKey || e.metaKey || e.altKey ) {
			return;
		}

		e.preventDefault();
		handleEpisodeLinkClick( episodeLinkEl );
	}
} );

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

	// Get episode's state icon container element
	const iconContainerEl = episodeEl.querySelector( '.podcast-player__episode-status-icon' );
	if ( ! iconContainerEl ) {
		return renderEpisodeError( episodeEl );
	}

	// Get player instance by block id
	const player = playerInstances[ blockEl.id ];
	if ( ! player ) {
		return renderEpisodeError( episodeEl );
	}

	// Pause the player and set the state classes
	player.audio.pause();
	blockEl.classList.remove( 'is-playing' );
	blockEl.classList.add( 'is-paused' );
	iconContainerEl.innerHTML = ''; // remove the icon

	// Get currently active episode element
	const activeEpisodeEl = blockEl.querySelector( '.is-active' );

	if ( activeEpisodeEl ) {
		activeEpisodeEl.querySelector( '.podcast-player__episode-status-icon' ).innerHTML = '';
		activeEpisodeEl.classList.remove( 'is-active' );
		activeEpisodeEl
			.querySelector( '[aria-pressed="true"]' )
			.setAttribute( 'aria-pressed', 'false' );
	}

	player.audio.src = audioUrl;

	player.audio
		.play()
		.then( function() {
			blockEl.classList.remove( 'is-paused', 'is-error' );
			blockEl.classList.add( 'is-playing' );
			iconContainerEl.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/></svg>';
		} )
		.catch( function() {
			blockEl.classList.remove( 'is-playing', 'is-paused' );
			blockEl.classList.add( 'is-error' );
			iconContainerEl.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';
			renderEpisodeError( episodeEl );
		} );

	// Episode should be active regardless of the Player state.
	episodeEl.classList.add( 'is-active' );
	episodeLinkEl.setAttribute( 'aria-pressed', 'true' );
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
