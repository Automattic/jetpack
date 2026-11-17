import { createEditSession } from '../../../../dashboard/components/editor/state/edit-session';
import { exportRecording, getRecordingRanges } from '../export';

describe( 'recording export', () => {
	it( 'keeps the trimmed ranges on both sides of each cut', () => {
		expect(
			getRecordingRanges( {
				...createEditSession( 10000 ),
				trimStartMs: 1000,
				trimEndMs: 9000,
				cuts: [
					{ id: 'first', startMs: 2000, endMs: 3000 },
					{ id: 'second', startMs: 6000, endMs: 8000 },
				],
			} )
		).toEqual( [
			{ startMs: 1000, endMs: 2000 },
			{ startMs: 3000, endMs: 6000 },
			{ startMs: 8000, endMs: 9000 },
		] );
	} );

	it( 'uploads an untouched recording without re-encoding it', async () => {
		const file = new File( [ 'video' ], 'recording.mp4', { type: 'video/mp4' } );
		await expect(
			exportRecording( file, createEditSession( 4000 ), new AbortController().signal, jest.fn() )
		).resolves.toBe( file );
	} );

	it( 'does not hand off a cancelled recording even when no export is necessary', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			exportRecording(
				new File( [], 'recording.mp4' ),
				createEditSession( 4000 ),
				controller.signal,
				jest.fn()
			)
		).rejects.toMatchObject( { name: 'AbortError' } );
	} );
} );
