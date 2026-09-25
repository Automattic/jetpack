import { useStatsSingleVideo } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useVideoSummary } from './use-video-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsSingleVideo: jest.fn(),
} ) );

const mockUseStatsSingleVideo = useStatsSingleVideo as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the single-video query result, defaulting to a resolved video.
 *
 * @param overrides - Fields to override on the default query result.
 */
function mockVideoQuery( overrides: Record< string, unknown > = {} ) {
	mockUseStatsSingleVideo.mockReturnValue( {
		data: { post: { id: 42, title: 'Demo', mimeType: 'video/mp4' } },
		isLoading: false,
		isError: false,
		isSuccess: true,
		refetch,
		...overrides,
	} );
}

describe( 'useVideoSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [ null, {}, { id: 0 } ] )(
		'treats a resolved post without a positive integer ID as not found',
		post => {
			mockVideoQuery( { data: { post } } );

			const { result } = renderHook( () => useVideoSummary( 42 ) );

			expect( result.current.isNotFound ).toBe( true );
		}
	);

	// The endpoint always sends `post_mime_type`: `image/*` for images, empty for
	// regular posts/pages, and a `video/` mime for videos. Only `video/` resolves.
	it.each( [ 'image/jpeg', '', undefined ] )(
		'treats a resolved non-video attachment (MIME type %p) as not found',
		mimeType => {
			mockVideoQuery( { data: { post: { id: 42, mimeType } } } );

			const { result } = renderHook( () => useVideoSummary( 42 ) );

			expect( result.current.isNotFound ).toBe( true );
		}
	);

	it.each( [ 'video/videopress', 'video/quicktime', 'video/mp4' ] )(
		'resolves a valid video attachment with MIME type %p',
		mimeType => {
			mockVideoQuery( { data: { post: { id: 42, mimeType } } } );

			const { result } = renderHook( () => useVideoSummary( 42 ) );

			expect( result.current.isNotFound ).toBe( false );
			expect( mockUseStatsSingleVideo ).toHaveBeenCalledWith( 42 );
		}
	);

	it( 'passes a safe http(s) poster URL through as posterUrl', () => {
		mockVideoQuery( {
			data: {
				post: {
					id: 42,
					mimeType: 'video/mp4',
					poster: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/demo.jpg',
				},
			},
		} );

		const { result } = renderHook( () => useVideoSummary( 42 ) );

		expect( result.current.posterUrl ).toBe(
			'https://i0.wp.com/videos.files.wordpress.com/abcd1234/demo.jpg'
		);
	} );

	it.each( [ undefined, 'javascript:alert(1)', 'not-a-url' ] )(
		'resolves no posterUrl for a missing or unsafe poster (%p)',
		poster => {
			mockVideoQuery( { data: { post: { id: 42, mimeType: 'video/mp4', poster } } } );

			const { result } = renderHook( () => useVideoSummary( 42 ) );

			expect( result.current.posterUrl ).toBeUndefined();
		}
	);

	it.each( [
		{ isLoading: true, isSuccess: false },
		{ isError: true, isSuccess: false },
	] )( 'does not report not found before a successful resolution', queryState => {
		mockVideoQuery( { data: { post: null }, ...queryState } );

		const { result } = renderHook( () => useVideoSummary( 42 ) );

		expect( result.current.isNotFound ).toBe( false );
	} );
} );
