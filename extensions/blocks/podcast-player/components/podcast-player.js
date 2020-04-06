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
import { STATE_PLAYING, STATE_ERROR, STATE_PAUSED } from '../constants';
import Playlist from './playlist';
import AudioPlayer from './audio-player';
import Header from './header';
import { getColorClassName } from '../utils';

// const debug = debugFactory( 'jetpack:podcast-player' );
const noop = () => {};

export class PodcastPlayer extends Component {
	state = {
		playerState: STATE_PAUSED,
		currentTrack: 0,
	};

	playerRef = player => {
		this.player = player;
		this.play = player ? player.play : noop;
		this.pause = player ? player.pause : noop;
		this.togglePlayPause = player ? player.togglePlayPause : noop;
		this.setAudioSource = player ? player.setAudioSource : noop;
	};

	/**
	 * Select a track and play/pause, as needed.
	 * @public
	 * @param {number} track The track number
	 */
	selectTrack = track => {
		const { currentTrack } = this.state;

		// Current track already selected.
		if ( currentTrack === track ) {
			this.togglePlayPause();
			return;
		}

		// Something else is playing.
		if ( currentTrack !== -1 ) {
			this.pause();
		}

		// Load a new track.
		this.loadAndPlay( track );
	};

	/**
	 * Load audio from the track, start playing.
	 * @private
	 * @param {number} track The track number
	 */
	loadAndPlay = track => {
		const trackData = this.getTrack( track );
		if ( ! trackData ) {
			return;
		}

		this.setState( { currentTrack: track } );
		this.setAudioSource( trackData.src );

		// Read that we're loading the track and its description. This is dismissible via ctrl on VoiceOver.
		/* translators: %s is the track title. It describes the current state of the track as "Loading: [track title]" */
		speak(
			`${ sprintf( __( 'Loading: %s', 'jetpack' ), trackData.title ) } ${ trackData.description }`,
			'assertive'
		);

		this.play();
	};

	/**
	 * Get track data.
	 * @private
	 * @param {number} track The track number
	 * @returns {object} Track object.
	 */
	getTrack = track => {
		return this.props.tracks[ track ];
	};

	/**
	 * Error handler for audio.
	 * @private
	 */
	handleError = () => {
		this.setState( { playerState: STATE_ERROR } );

		speak( `${ __( 'Error: Episode unavailable - Open in a new tab', 'jetpack' ) }`, 'assertive' );
	};

	/**
	 * Play handler for audio.
	 * @private
	 */
	handlePlay = () => {
		this.setState( {
			playerState: STATE_PLAYING,
		} );
	};

	/**
	 * Pause handler for audio.
	 * @private
	 */
	handlePause = () => {
		// Ignore pauses if we are showing an error.
		if ( this.state.playerState === STATE_ERROR ) {
			return;
		}
		this.setState( { playerState: STATE_PAUSED } );
	};

	/**
	 * Play current audio.
	 * @public
	 */
	play = noop;

	/**
	 * Pause current audio.
	 * @public
	 */
	pause = noop;

	/**
	 * Toggle playing state.
	 * @public
	 */
	togglePlayPause = noop;

	/**
	 * Set audio source.
	 * @param {string} src The url of audio content.
	 * @public
	 */
	setAudioSource = noop;

	render() {
		const { playerId, title, link, cover, tracks, attributes } = this.props;
		const {
			itemsToShow,
			primaryColor,
			customPrimaryColor,
			secondaryColor,
			customSecondaryColor,
			backgroundColor,
			customBackgroundColor,
			showCoverArt,
			showEpisodeDescription,
		} = attributes;
		const { playerState, currentTrack } = this.state;

		const tracksToDisplay = tracks.slice( 0, itemsToShow );
		const track = this.getTrack( currentTrack );

		// Set CSS classes string.
		const primaryColorClass = getColorClassName( 'color', primaryColor );
		const secondaryColorClass = getColorClassName( 'color', secondaryColor );
		const backgroundColorClass = getColorClassName( 'background-color', backgroundColor );

		const colors = {
			primary: {
				name: primaryColor,
				custom: customPrimaryColor,
				classes: classnames( {
					'has-primary': primaryColorClass || customPrimaryColor,
					[ primaryColorClass ]: primaryColorClass,
				} ),
			},
			secondary: {
				name: secondaryColor,
				custom: customSecondaryColor,
				classes: classnames( {
					'has-secondary': secondaryColorClass || customSecondaryColor,
					[ secondaryColorClass ]: secondaryColorClass,
				} ),
			},
			background: {
				name: backgroundColor,
				custom: customBackgroundColor,
				classes: classnames( {
					'has-background': backgroundColorClass || customBackgroundColor,
					[ backgroundColorClass ]: backgroundColorClass,
				} ),
			},
		};

		const inlineStyle = {
			color: customSecondaryColor && ! secondaryColorClass ? customSecondaryColor : null,
			backgroundColor:
				customBackgroundColor && ! backgroundColorClass ? customBackgroundColor : null,
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
				style={ Object.keys( inlineStyle ).length ? inlineStyle : null }
				aria-labelledby={ title || ( track && track.title ) ? `${ playerId }__title` : undefined }
				aria-describedby={
					track && track.description ? `${ playerId }__track-description` : undefined
				}
				// The following line ensures compatibility with Calypso previews (jetpack-iframe-embed.js).
				data-jetpack-iframe-ignore
			>
				<Header
					playerId={ playerId }
					title={ title }
					link={ link }
					cover={ cover }
					track={ this.getTrack( currentTrack ) }
					showCoverArt={ showCoverArt }
					showEpisodeDescription={ showEpisodeDescription }
					colors={ colors }
				>
					<AudioPlayer
						initialTrackSource={ this.getTrack( 0 ).src }
						handlePlay={ this.handlePlay }
						handlePause={ this.handlePause }
						handleError={ this.handleError }
						ref={ this.playerRef }
					/>
				</Header>

				<h4
					id={ `jetpack-podcast-player__tracklist-title--${ playerId }` }
					className="jetpack-podcast-player--visually-hidden"
				>
					{ /* translators: %s is the track title. This describes what the playlist goes with, like "Playlist: [name of the podcast]" */ }
					{ sprintf( __( 'Playlist: %s', 'jetpack' ), title ) }
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
		showEpisodeDescription: true,
	},
	tracks: [],
};

export default PodcastPlayer;
