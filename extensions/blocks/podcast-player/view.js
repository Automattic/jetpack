/* global jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';
import PodcastPlayer from './podcast-player';

const playerInstances = {};

const initializeBlock = function( id ) {
	// Create player instance.
	const player = new PodcastPlayer( id );

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
	playerInstances,
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

function renderEpisodeError() {}

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

function getSoundIconHTML() {}
function getErrorIconHTML() {}
