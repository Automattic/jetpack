import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { exportRecording } from '../../../lib/video-recording/export';
import RecordingEditor from '../recording-editor';

jest.mock( '../../../lib/video-recording/export', () => ( {
	exportRecording: jest.fn(),
} ) );
jest.mock( '../../../../dashboard/components/editor/preview/use-preview-playback', () => ( {
	usePreviewPlayback: () => ( {
		attachVideo: jest.fn(),
		hasMetadata: true,
		durationMs: 6000,
		pause: jest.fn(),
		playbackError: null,
	} ),
} ) );
jest.mock( '../../../../dashboard/components/editor/timeline/timeline', () => ( {
	__esModule: true,
	default: ( { dispatch } ) => (
		<button
			onClick={ () =>
				dispatch( {
					type: 'LOAD',
					durationMs: 6000,
					operations: [
						{ type: 'trim', start_ms: 1000, end_ms: 5000 },
						{ type: 'cut', start_ms: 2000, end_ms: 3000 },
					],
				} )
			}
		>
			Edit recording
		</button>
	),
} ) );

const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;
const file = new File( [ 'original' ], 'recording.mp4', { type: 'video/mp4' } );
const edited = new File( [ 'edited' ], 'edited.mp4', { type: 'video/mp4' } );

beforeEach( () => {
	jest.clearAllMocks();
	Object.defineProperties( URL, {
		createObjectURL: { configurable: true, value: jest.fn( () => 'blob:recording' ) },
		revokeObjectURL: { configurable: true, value: jest.fn() },
	} );
} );
afterAll( () => {
	Object.defineProperties( URL, {
		createObjectURL: { value: originalCreateURL },
		revokeObjectURL: { value: originalRevokeURL },
	} );
} );

it( 'applies timeline edits locally and hands the exported file to the uploader', async () => {
	jest.mocked( exportRecording ).mockResolvedValue( edited );
	const onUpload = jest.fn();
	render(
		<RecordingEditor
			file={ file }
			onUpload={ onUpload }
			onRecordAgain={ jest.fn() }
			blocked={ false }
		/>
	);
	await userEvent.click( screen.getByRole( 'button', { name: 'Edit recording' } ) );
	await userEvent.click( screen.getByRole( 'button', { name: 'Upload recording' } ) );
	expect( exportRecording ).toHaveBeenCalledWith(
		file,
		expect.objectContaining( {
			trimStartMs: 1000,
			trimEndMs: 5000,
			cuts: [ expect.objectContaining( { startMs: 2000, endMs: 3000 } ) ],
		} ),
		expect.any( AbortSignal ),
		expect.any( Function )
	);
	expect( onUpload ).toHaveBeenCalledWith( edited );
} );

it( 'aborts export and prevents late upload when the recording workspace is closed', async () => {
	let finish: ( file: File ) => void;
	jest.mocked( exportRecording ).mockReturnValue( new Promise( resolve => ( finish = resolve ) ) );
	const onUpload = jest.fn();
	const { unmount } = render(
		<RecordingEditor
			file={ file }
			onUpload={ onUpload }
			onRecordAgain={ jest.fn() }
			blocked={ false }
		/>
	);
	await userEvent.click( screen.getByRole( 'button', { name: 'Upload recording' } ) );
	const signal = jest.mocked( exportRecording ).mock.calls[ 0 ][ 2 ];
	unmount();
	await act( async () => finish( edited ) );
	expect( signal.aborted ).toBe( true );
	expect( onUpload ).not.toHaveBeenCalled();
	expect( URL.revokeObjectURL ).toHaveBeenCalledWith( 'blob:recording' );
} );
