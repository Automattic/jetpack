/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

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
		const secondaryColorClass = getColorClassName( 'color', secondaryColor );
		const backgroundColorClass = getColorClassName( 'background-color', backgroundColor );

		const cssClassesName = classnames( playerState, {
			'has-secondary': secondaryColor || customSecondaryColor,
			[ secondaryColorClass ]: secondaryColorClass,
			'has-background': backgroundColor || customBackgroundColor,
			[ backgroundColorClass ]: backgroundColorClass,
		} );

		const inlineStyle = {
			color: customSecondaryColor && ! secondaryColorClass ? customSecondaryColor : null,
			backgroundColor:
				customBackgroundColor && ! backgroundColorClass ? customBackgroundColor : null,
		};

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
				>
					<AudioPlayer
						initialTrackSource={ this.getTrack( 0 ).src }
						handlePlay={ this.handlePlay }
						handlePause={ this.handlePause }
						handleError={ this.handleError }
						ref={ this.playerRef }
					/>
				</Header>
				<Playlist
					playerState={ playerState }
					currentTrack={ currentTrack }
					tracks={ tracksToDisplay }
					selectTrack={ this.selectTrack }
					colors={ {
						primary: {
							name: primaryColor,
							custom: customPrimaryColor,
						},
						secondary: {
							name: secondaryColor,
							custom: customSecondaryColor,
						},
					} }
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
