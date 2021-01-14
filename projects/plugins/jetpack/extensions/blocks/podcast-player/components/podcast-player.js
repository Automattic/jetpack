/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import {
	STATE_PLAYING,
	STATE_ERROR,
	STATE_PAUSED,
} from '../../../shared/components/audio-player/constants';
import Playlist from './playlist';
import AudioPlayer from '../../../shared/components/audio-player';
import Header from './header';
import { getColorsObject } from '../utils';
import withErrorBoundary from './with-error-boundary';

export class PodcastPlayer extends Component {
	state = {
		playerState: STATE_PAUSED,
		currentTrack: 0,
		hasUserInteraction: false,
		currentTime: 0,
		skipDuration: 30,
		rewindDuration: 5,
	};

	/**
	 * Record the user has interacted with the player.
	 *
	 * @private
	 */
	recordUserInteraction = () => {
		if ( ! this.state.hasUserInteraction ) {
			this.setState( { hasUserInteraction: true } );
		}
	};

	/**
	 * Select a track and play/pause, as needed.
	 *
	 * @public
	 * @param {number} track - The track number
	 */
	selectTrack = track => {
		const { currentTrack } = this.state;

		// Current track already selected.
		if ( currentTrack === track ) {
			this.recordUserInteraction();
			this.togglePlayPause();
			return;
		}

		// Something else is playing.
		if ( currentTrack !== -1 ) {
			this.setState( { playerState: STATE_PAUSED } );
		}

		// Load a new track.
		this.loadAndPlay( track );
	};

	/**
	 * Load audio from the track, start playing.
	 *
	 * @private
	 * @param {number} track - The track number
	 */
	loadAndPlay = track => {
		// Record that user has interacted.
		this.recordUserInteraction();

		const trackData = this.getTrack( track );
		if ( ! trackData ) {
			return;
		}

		this.setState( { currentTrack: track, playerState: STATE_PLAYING } );

		/*
		 * Read that we're loading the track and its description. This is
		 * dismissible via ctrl on VoiceOver.
		 */
		speak(
			/* translators: %s is the track title. It describes the current state of the track as "Loading: [track title]". */
			`${ sprintf( __( 'Loading: %s', 'jetpack' ), trackData.title ) } ${ trackData.description }`,
			'assertive'
		);
	};

	/**
	 * Get track data.
	 *
	 * @private
	 * @param {number} track - The track number
	 * @returns {object} Track object.
	 */
	getTrack = track => {
		return this.props.tracks[ track ];
	};

	/**
	 * Error handler for audio.
	 *
	 * @private
	 * @param {object} error - The error object
	 */
	handleError = error => {
		// If an error happens before any user interaction, our player is broken beyond repair.
		if ( ! this.state.hasUserInteraction ) {
			// There is a known error where IE11 doesn't support the <audio> element by
			// default but errors instead. If the user is using IE11 we thus provide
			// additional instructions on how they can turn on <audio> support.
			const isIE11 = window.navigator.userAgent.match( /Trident\/7\./ );
			// Internal error message, no translation needed
			const playerError = isIE11
				? 'IE11: Playing sounds in webpages setting is not checked'
				: error;
			// setState wrapper makes sure our ErrorBoundary handles the error.
			this.setState( () => {
				throw new Error( playerError );
			} );
		}

		// Otherwise, let's just mark the episode as broken.
		this.setState( { playerState: STATE_ERROR } );
		speak( `${ __( 'Error: Episode unavailable - Open in a new tab', 'jetpack' ) }`, 'assertive' );
	};

	/**
	 * Play handler for audio.
	 *
	 * @private
	 */
	handlePlay = () => {
		this.setState( {
			playerState: STATE_PLAYING,
			hasUserInteraction: true,
		} );
	};

	/**
	 * Pause handler for audio.
	 *
	 * @private
	 */
	handlePause = () => {
		// Ignore pauses if we are showing an error.
		if ( this.state.playerState === STATE_ERROR ) {
			return;
		}
		this.setState( { playerState: STATE_PAUSED } );
	};

	handleTimeChange = currentTime => {
		this.setState( { currentTime } );
	};

	/**
	 * Toggle playing state.
	 *
	 * @public
	 */
	togglePlayPause = () => {
		const action = this.state.playerState === STATE_PLAYING ? this.handlePause : this.handlePlay;
		action();
	};

	handleJump = () => {
		this.setState( { currentTime: this.state.currentTime - 5 } );
	};

	handleSkip = () => {
		this.setState( { currentTime: this.state.currentTime + 30 } );
	};

	render() {
		const { playerId, title, link, cover, tracks, attributes } = this.props;
		const {
			itemsToShow,
			primaryColor,
			customPrimaryColor,
			hexPrimaryColor,
			secondaryColor,
			customSecondaryColor,
			hexSecondaryColor,
			backgroundColor,
			customBackgroundColor,
			hexBackgroundColor,
			showCoverArt,
			showEpisodeTitle,
			showEpisodeDescription,
		} = attributes;
		const { playerState, currentTrack } = this.state;

		const tracksToDisplay = tracks.slice( 0, itemsToShow );
		const track = this.getTrack( currentTrack );

		const colors = getColorsObject( {
			primaryColor,
			customPrimaryColor,
			secondaryColor,
			customSecondaryColor,
			backgroundColor,
			customBackgroundColor,
		} );

		/*
		 * Set colors through inline styles.
		 * Also, add CSS variables.
		 */
		const inlineStyle = {
			color: customSecondaryColor,
			backgroundColor: customBackgroundColor,
			'--jetpack-podcast-player-primary': hexPrimaryColor,
			'--jetpack-podcast-player-secondary': hexSecondaryColor,
			'--jetpack-podcast-player-background': hexBackgroundColor,
		};

		const cssClassesName = classnames(
			'jetpack-podcast-player',
			playerState,
			colors.secondary.classes,
			colors.background.classes
		);

		return (
			<section
				className={ cssClassesName }
				style={ inlineStyle }
				aria-labelledby={ title || ( track && track.title ) ? `${ playerId }__title` : undefined }
				aria-describedby={
					track && track.description ? `${ playerId }__track-description` : undefined
				}
				/*
				 * The following line ensures compatibility with Calypso previews
				 * (jetpack-iframe-embed.js).
				 */
				data-jetpack-iframe-ignore
			>
				<Header
					playerId={ playerId }
					title={ title }
					link={ link }
					cover={ cover }
					track={ this.getTrack( currentTrack ) }
					showCoverArt={ showCoverArt }
					showEpisodeTitle={ showEpisodeTitle }
					showEpisodeDescription={ showEpisodeDescription }
					colors={ colors }
				>
					<AudioPlayer
						onJumpBack={ this.handleJump }
						onSkipForward={ this.handleSkip }
						trackSource={ this.getTrack( currentTrack ).src }
						onPlay={ this.handlePlay }
						onPause={ this.handlePause }
						onError={ this.handleError }
						playStatus={ this.state.playerState }
						currentTime={ this.state.currentTime }
						onTimeChange={ this.handleTimeChange }
					/>
				</Header>

				{ tracksToDisplay.length > 1 && (
					<>
						<h4
							id={ `jetpack-podcast-player__tracklist-title--${ playerId }` }
							className="jetpack-podcast-player--visually-hidden"
						>
							{ /*
							 * This describes what the playlist goes with, like "Playlist: [name
							 * of the podcast]".
							 */ }
							{ sprintf(
								// translators: %s is the track title.
								__( 'Playlist: %s', 'jetpack' ),
								title
							) }
						</h4>
						<p
							id={ `jetpack-podcast-player__tracklist-description--${ playerId }` }
							className="jetpack-podcast-player--visually-hidden"
						>
							{ __( 'Select an episode to play it in the audio player.', 'jetpack' ) }
						</p>
						<Playlist
							playerId={ playerId }
							playerState={ playerState }
							currentTrack={ currentTrack }
							tracks={ tracksToDisplay }
							selectTrack={ this.selectTrack }
							colors={ colors }
						/>
					</>
				) }
			</section>
		);
	}
}

PodcastPlayer.defaultProps = {
	title: '',
	cover: '',
	link: '',
	attributes: {
		url: null,
		itemsToShow: 5,
		showCoverArt: true,
		showEpisodeTitle: true,
		showEpisodeDescription: true,
	},
	tracks: [],
};

export default withErrorBoundary( PodcastPlayer );
