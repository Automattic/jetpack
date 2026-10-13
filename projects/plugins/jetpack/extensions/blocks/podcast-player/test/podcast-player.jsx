import { render } from '@testing-library/react';
import AudioPlayer from '../../../shared/components/audio-player';
import { PodcastPlayer } from '../components/podcast-player';

// Stub the audio player so we can assert the props the block hands it without
// mounting the real MediaElement machinery.
jest.mock( '../../../shared/components/audio-player', () => jest.fn( () => null ) );

const track = {
	id: '1',
	guid: 'guid-1',
	title: 'Episode 1',
	link: 'https://example.com/episode',
	src: 'https://example.com/episode.mp3',
	description: '',
};

const defaultProps = {
	playerId: 'podcast-player-1',
	title: 'My Podcast',
	tracks: [ track ],
	playerState: 'is-paused',
	attributes: {
		itemsToShow: 5,
		showCoverArt: false,
		showEpisodeTitle: false,
		showEpisodeDescription: false,
	},
	// Media-source store dispatchers, unused by this render but called on mount.
	registerMediaSource: jest.fn(),
	setDefaultMediaSource: jest.fn(),
	unregisterMediaSource: jest.fn(),
	updateMediaSourceData: jest.fn(),
	toggleMediaSource: jest.fn(),
	pauseMediaSource: jest.fn(),
	playMediaSource: jest.fn(),
	errorMediaSource: jest.fn(),
	setMediaSourceCurrentTime: jest.fn(),
};

describe( 'PodcastPlayer', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the audio player with preload disabled to avoid inflating download metrics', () => {
		render( <PodcastPlayer { ...defaultProps } /> );

		expect( AudioPlayer ).toHaveBeenCalledWith(
			expect.objectContaining( { preload: 'none', trackSource: track.src } ),
			expect.anything()
		);
	} );
} );
