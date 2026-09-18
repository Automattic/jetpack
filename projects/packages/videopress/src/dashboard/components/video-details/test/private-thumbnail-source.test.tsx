import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import ThumbnailCard from '../thumbnail-card';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;
const sourceUrl = 'https://videos.files.wordpress.com/abc123/original.mov';
const playbackUrl = 'https://videos.files.wordpress.com/abc123/video_dvd.mp4?download=1';
const privateVideo = makeLibraryItem( {
	thumbnailUrl: 'https://videos.files.wordpress.com/abc123/poster.jpg',
	sourceUrl,
	playbackUrl,
	isPrivate: true,
} );

/**
 * Create an isolated query cache without automatic retries.
 *
 * @return The query provider wrapper.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
}

/**
 * Find the video inside the portaled dialog.
 *
 * @return The video element, if mounted.
 */
function getVideo(): HTMLVideoElement | null {
	return document.querySelector( 'video' );
}

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

it( 'waits for a shared playback token before loading the private MP4 rendition', async () => {
	let resolveToken: ( value: { playback_token: string } ) => void = () => {};
	mockedApiFetch.mockReturnValueOnce(
		new Promise( resolve => {
			resolveToken = resolve;
		} )
	);
	const user = userEvent.setup();
	render( <ThumbnailCard video={ privateVideo } />, { wrapper: makeWrapper() } );
	await user.click( screen.getByRole( 'button', { name: /select from video/i } ) );

	expect( getVideo() ).toBeNull();
	expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
	expect( mockedApiFetch ).toHaveBeenCalledWith( {
		path: '/wpcom/v2/videopress/playback-jwt/abc123',
		method: 'POST',
	} );

	resolveToken( { playback_token: 'token-123' } );
	await waitFor( () =>
		expect( getVideo() ).toHaveAttribute( 'src', `${ playbackUrl }&metadata_token=token-123` )
	);
	expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
} );

it.each( [ 'empty', 'rejected' ] )(
	'offers retry without loading video when the token is %s',
	async failure => {
		if ( failure === 'empty' ) {
			mockedApiFetch.mockResolvedValue( { playback_token: '' } );
		} else {
			mockedApiFetch.mockRejectedValue( { code: 'rest_forbidden', message: 'Forbidden' } );
		}
		const user = userEvent.setup();
		render( <ThumbnailCard video={ privateVideo } />, { wrapper: makeWrapper() } );
		await user.click( screen.getByRole( 'button', { name: /select from video/i } ) );

		const retry = await screen.findByRole( 'button', { name: 'Retry' } );
		expect( getVideo() ).toBeNull();

		mockedApiFetch.mockResolvedValue( { playback_token: 'retry-token' } );
		await user.click( retry );
		await waitFor( () =>
			expect( getVideo() ).toHaveAttribute( 'src', `${ playbackUrl }&metadata_token=retry-token` )
		);
	}
);

it( 'signs the private original when there is no MP4 rendition', async () => {
	mockedApiFetch.mockResolvedValue( { playback_token: 'token-123' } );
	const user = userEvent.setup();
	render( <ThumbnailCard video={ { ...privateVideo, playbackUrl: undefined } } />, {
		wrapper: makeWrapper(),
	} );
	await user.click( screen.getByRole( 'button', { name: /select from video/i } ) );

	await waitFor( () =>
		expect( getVideo() ).toHaveAttribute( 'src', `${ sourceUrl }?metadata_token=token-123` )
	);
} );

it.each( [
	{ label: 'MP4 rendition', sourceUrl, playbackUrl, expected: playbackUrl },
	{ label: 'original fallback', sourceUrl, playbackUrl: undefined, expected: sourceUrl },
	{
		label: 'rendition without an original',
		sourceUrl: undefined,
		playbackUrl,
		expected: playbackUrl,
	},
] )( 'loads a public $label without requesting a token', async video => {
	const user = userEvent.setup();
	render( <ThumbnailCard video={ { ...privateVideo, ...video, isPrivate: false } } />, {
		wrapper: makeWrapper(),
	} );
	await user.click( screen.getByRole( 'button', { name: /select from video/i } ) );

	expect( getVideo() ).toHaveAttribute( 'src', video.expected );
	expect( mockedApiFetch ).not.toHaveBeenCalled();
} );

it( 'resets the selected frame when the source changes', async () => {
	mockedApiFetch.mockResolvedValue( { playback_token: 'token-123' } );
	const user = userEvent.setup();
	const { rerender } = render( <ThumbnailCard video={ privateVideo } />, {
		wrapper: makeWrapper(),
	} );
	await user.click( screen.getByRole( 'button', { name: /select from video/i } ) );
	await waitFor( () => expect( getVideo() ).not.toBeNull() );
	const video = getVideo() as HTMLVideoElement;
	Object.defineProperty( video, 'duration', { configurable: true, value: 30 } );
	fireEvent.durationChange( video );
	const confirm = screen.getByRole( 'button', { name: /select this frame/i } );
	expect( confirm ).not.toHaveAttribute( 'aria-disabled', 'true' );

	rerender(
		<ThumbnailCard video={ { ...privateVideo, playbackUrl: `${ sourceUrl }?updated=1` } } />
	);
	await waitFor( () => expect( getVideo() ).not.toBe( video ) );
	expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
} );
