import { speak } from '@wordpress/a11y';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import AudioPlayer from '../../../shared/components/audio-player';
import { STATE_ERROR, STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';
import { getColorsObject } from '../utils';
import Header from './header';
import Playlist from './playlist';
import withErrorBoundary from './with-error-boundary';

export class PodcastPlayer extends Component {
	state = {
		currentTrack: 0,
		hasUserInteraction: false,
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
			this.props.toggleMediaSource( this.props.playerId );
			return;
		}

		// Something else is playing.
		if ( currentTrack !== -1 ) {
			this.props.pauseMediaSource( this.props.playerId );
		}

		// Load a new track.
		this.loadAndPlay( track );
	};

	/**
	 * Load the audio track into the player
	 *
	 * @private
	 * @param {number} track - The track number
	 * @returns {boolean} Whether loading of the track was successful
	 */
	loadTrack = track => {
		const trackData = this.getTrack( track );
		if ( ! trackData ) {
			return false;
		}

		if ( this.state.currentTrack !== track ) {
			this.setState( { currentTrack: track } );
		}

		const { title, link, description } = trackData;
		this.props.updateMediaSourceData( this.props.playerId, {
			title,
			link,
		} );

		/*
		 * Read that we're loading the track and its description. This is
		 * dismissible via ctrl on VoiceOver.
		 */
		speak(
			/* translators: %s is the track title. It describes the current state of the track as "Loading: [track title]". */
			`${ sprintf( __( 'Loading: %s', 'jetpack' ), title ) } ${ description }`,
			'assertive'
		);

		return true;
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

		if ( ! this.loadTrack( track ) ) {
			return;
		}

		this.props.playMediaSource( this.props.playerId );
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
		this.props.errorMediaSource( this.props.playerId );
		speak( `${ __( 'Error: Episode unavailable - Open in a new tab', 'jetpack' ) }`, 'assertive' );
	};

	/**
	 * Play handler for audio.
	 *
	 * @private
	 */
	handlePlay = () => {
		this.props.playMediaSource( this.props.playerId );
		this.setState( { hasUserInteraction: true } );
	};

	/**
	 * Pause handler for audio.
	 *
	 * @private
	 */
	handlePause = () => {
		this.props.pauseMediaSource( this.props.playerId );
		// Ignore pauses if we are showing an error.
		if ( this.props.playerState === STATE_ERROR ) {
			return;
		}
		this.props.pauseMediaSource( this.props.playerId );
	};

	handleTimeChange = currentTime => {
		this.props.setMediaSourceCurrentTime( this.props.playerId, currentTime );
	};

	handleJump = () => {
		this.props.setMediaSourceCurrentTime( this.props.playerId, this.props.currentTime - 5 );
	};

	handleSkip = () => {
		this.props.setMediaSourceCurrentTime( this.props.playerId, this.props.currentTime + 30 );
	};

	updateMediaData = event => {
		this.props.updateMediaSourceData( this.props.playerId, {
			duration: event.target?.duration,
			domId: event.target?.id,
		} );
	};

	registerPlayer() {
		// Register Media source monstly episode data.
		const track = this.getTrack( this.state.currentTrack ) || {};
		const { playerId } = this.props;

		this.props.registerMediaSource( playerId, {
			title: track.title,
			link: track.link,
			state: STATE_PAUSED,
		} );

		// Set podcast player instance as default.
		this.props.setDefaultMediaSource( playerId );
	}

	componentDidMount() {
		if ( ! this.props.playerId ) {
			return;
		}

		this.registerPlayer();
	}

	componentWillUnmount() {
		if ( ! this.props.playerId ) {
			return;
		}

		this.props.unregisterMediaSource( this.props.playerId );
	}

	componentDidUpdate( prevProps ) {
		const trackGuids = tracks => ( tracks?.length ? tracks.map( track => track.guid ) : [] );
		const guids = trackGuids( this.props.tracks );
		const prevGuids = new Set( trackGuids( prevProps.tracks ) );

		// This equality check is a bit rough. It relies on the guids being unique for example, but
		// it should be fine for our requirements.
		if ( guids.length !== prevGuids.size || ! guids.every( guid => prevGuids.has( guid ) ) ) {
			this.loadTrack( 0 );
		}
	}

	static getDerivedStateFromProps( props, state ) {
		// There might be a better way, but this is to avoid renders breaking when the current
		// track is set to an index higher than the number of tracks we've received.
		if ( props.tracks.length <= state.currentTrack ) {
			return {
				...state,
				currentTrack: 0,
			};
		}
		return null;
	}

	render() {
		const { playerId, title, link, cover, tracks, attributes, currentTime, playerState } =
			this.props;
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
		const { currentTrack } = this.state;

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

		const cssClassesName = clsx(
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
						playStatus={ playerState }
						currentTime={ currentTime }
						onTimeChange={ this.handleTimeChange }
						onMetadataLoaded={ this.updateMediaData }
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

export default compose( [
	withErrorBoundary,
	withSelect( ( select, props ) => {
		const { playerId } = props;
		const { getMediaSourceCurrentTime, getMediaPlayerState } = select( STORE_ID );

		return {
			currentTime: getMediaSourceCurrentTime( playerId ),
			playerState: getMediaPlayerState( playerId ),
		};
	} ),
	withDispatch( dispatch => {
		const {
			registerMediaSource,
			updateMediaSourceData,
			unregisterMediaSource,
			setDefaultMediaSource,
			playMediaSource,
			pauseMediaSource,
			toggleMediaSource,
			errorMediaSource,
			setMediaSourceCurrentTime,
		} = dispatch( STORE_ID );
		return {
			registerMediaSource,
			updateMediaSourceData,
			unregisterMediaSource,
			setDefaultMediaSource,
			playMediaSource,
			pauseMediaSource,
			toggleMediaSource,
			errorMediaSource,
			setMediaSourceCurrentTime,
		};
	} ),
] )( PodcastPlayer );
