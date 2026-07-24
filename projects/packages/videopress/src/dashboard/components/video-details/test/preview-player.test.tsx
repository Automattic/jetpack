import { render, screen, waitFor } from '@testing-library/react';
import getMediaToken from '../../../../client/lib/get-media-token';
import PreviewPlayer from '../preview-player';
import type { LibraryItem } from '../../../types/library';

jest.mock( '../../../../client/lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
const mockedGetMediaToken = getMediaToken as unknown as jest.Mock;

const baseVideo: LibraryItem = {
	id: '42',
	guid: 'abc123',
	type: 'videopress',
	title: 'My video',
	filename: 'movie.mp4',
	thumbnailUrl: 'https://example.test/poster.jpg',
	durationSeconds: 60,
	uploadDate: '2026-01-01T00:00:00',
	privacy: 'public',
	isPrivate: false,
	fileSizeBytes: 0,
	upload: { status: 'idle', progress: 0 },
	description: '',
	rating: 'G',
	displayEmbed: true,
	allowDownloads: false,
	shortcode: '[videopress abc123]',
	sourceUrl: 'https://example.test/movie.mp4',
	isProcessing: false,
	orientation: null,
	tracks: [],
};

beforeEach( () => {
	mockedGetMediaToken.mockReset();
} );

describe( 'PreviewPlayer', () => {
	it( 'embeds the public VideoPress player without minting a token', () => {
		render( <PreviewPlayer video={ baseVideo } /> );

		const iframe = screen.getByTitle( 'Video preview' );
		expect( iframe ).toHaveAttribute(
			'src',
			expect.stringContaining( 'https://videopress.com/embed/abc123' )
		);
		expect( mockedGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'private video: embeds from video.wordpress.com with the minted playback token', async () => {
		mockedGetMediaToken.mockResolvedValueOnce( { token: 'tok-1' } );
		render( <PreviewPlayer video={ { ...baseVideo, isPrivate: true } } /> );

		const iframe = await screen.findByTitle( 'Video preview' );
		expect( mockedGetMediaToken ).toHaveBeenCalledWith( 'playback', { guid: 'abc123' } );
		expect( iframe ).toHaveAttribute(
			'src',
			expect.stringContaining( 'https://video.wordpress.com/embed/abc123' )
		);
		expect( iframe ).toHaveAttribute( 'src', expect.stringContaining( 'metadata_token=tok-1' ) );
	} );

	it( 'private video: falls back to the tokenless embed when minting fails', async () => {
		mockedGetMediaToken.mockRejectedValueOnce( new Error( 'nope' ) );
		render( <PreviewPlayer video={ { ...baseVideo, isPrivate: true } } /> );

		const iframe = await screen.findByTitle( 'Video preview' );
		await waitFor( () =>
			expect( iframe ).not.toHaveAttribute( 'src', expect.stringContaining( 'metadata_token' ) )
		);
	} );

	it( 'embeds the player while transcoding, whose converting screen reports progress', () => {
		render( <PreviewPlayer video={ { ...baseVideo, isProcessing: true } } /> );

		expect( screen.getByTitle( 'Video preview' ) ).toHaveAttribute(
			'src',
			expect.stringContaining( 'https://videopress.com/embed/abc123' )
		);
		expect( screen.queryByText( 'Processing' ) ).not.toBeInTheDocument();
	} );

	it( 'plays local items without a GUID through a native video element', () => {
		render( <PreviewPlayer video={ { ...baseVideo, type: 'local', guid: '' } } /> );

		const video = screen.getByLabelText( 'Video preview' );
		expect( video.tagName ).toBe( 'VIDEO' );
		expect( video ).toHaveAttribute( 'src', 'https://example.test/movie.mp4' );
	} );

	it( 'renders nothing when there is no GUID and no direct source', () => {
		const { container } = render(
			<PreviewPlayer video={ { ...baseVideo, guid: '', sourceUrl: undefined } } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
