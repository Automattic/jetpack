import { act, renderHook } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useLibrary } from '../use-library';
import { useVideo } from '../use-video';
import { useVideoEdits } from '../use-video-edits';

it( 'polls only the edit job, then refreshes metadata and counts once at completion', async () => {
	jest.useFakeTimers();
	try {
		let complete = false;
		const fetch = mockApiFetch( async ( { path } ) => {
			if ( path?.endsWith( '/edits' ) ) {
				return {
					guid: 'AbCd1234',
					revision: complete ? 1 : 0,
					job: { id: '123', status: complete ? 'complete' : 'processing' },
				};
			}
			const video = {
				id: 42,
				jetpack_videopress: { guid: 'AbCd1234' },
				media_details: { videopress: { finished: complete } },
			};
			if ( path === '/wp/v2/media/42' ) {
				return video;
			}
			return {
				headers: new Headers( { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' } ),
				json: async () => [ video ],
			};
		} );
		renderHook(
			() => {
				useVideo( 42, { poll: false } );
				const { edits } = useVideoEdits( 'AbCd1234' );
				useVideo( 42, { poll: edits?.job.status === 'idle' } );
				useLibrary( { type: 'table', page: 1, perPage: 1, fields: [] }, { poll: false } );
			},
			{ wrapper: createTestWrapper() }
		);
		await act( async () => jest.advanceTimersByTimeAsync( 10001 ) );
		const count = ( fragment: string ) =>
			fetch.mock.calls.filter( ( [ request ] ) => request.path?.includes( fragment ) ).length;
		expect( count( '/edits' ) ).toBe( 3 );
		expect( count( '/media/42' ) ).toBe( 1 );
		expect( count( '/media?' ) ).toBe( 1 );
		complete = true;
		await act( async () => jest.advanceTimersByTimeAsync( 5001 ) );
		expect( count( '/media/42' ) ).toBe( 2 );
		expect( count( '/media?' ) ).toBe( 2 );
		const total = fetch.mock.calls.length;
		await act( async () => jest.advanceTimersByTimeAsync( 30000 ) );
		expect( fetch ).toHaveBeenCalledTimes( total );
	} finally {
		jest.useRealTimers();
	}
} );
