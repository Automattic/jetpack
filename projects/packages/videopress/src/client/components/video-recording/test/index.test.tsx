import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRecordingMimeType } from '../../../lib/video-recording';
import { recordCamera } from '../../../lib/video-recording/camera';
import RecordingModal from '../modal';

jest.mock( '../../../lib/video-recording', () => ( {
	getRecordingMimeType: jest.fn(),
} ) );
jest.mock( '../../../lib/video-recording/camera', () => ( { recordCamera: jest.fn() } ) );
jest.mock( '../recording-stage', () => jest.requireActual( '../fixtures/recording-stage' ) );

jest.mock( '../recording-editor', () => ( {
	__esModule: true,
	default: ( { onUpload, file } ) => (
		<button onClick={ () => onUpload( file ) }>Upload recording</button>
	),
} ) );

const originalDevices = navigator.mediaDevices;
const getUserMedia = jest.fn();
const stopTrack = jest.fn();
const stream = { getTracks: () => [ { stop: stopTrack } ] } as unknown as MediaStream;

beforeEach( () => {
	jest.clearAllMocks();
	Object.defineProperty( navigator, 'mediaDevices', {
		configurable: true,
		value: { getUserMedia },
	} );
	jest.mocked( getRecordingMimeType ).mockReturnValue( 'video/mp4' );
	getUserMedia.mockResolvedValue( stream );
} );

afterAll( () => {
	Object.defineProperty( navigator, 'mediaDevices', { value: originalDevices } );
} );

it( 'releases a camera granted after the modal was closed', async () => {
	let grant: ( media: MediaStream ) => void;
	getUserMedia.mockReturnValue( new Promise( resolve => ( grant = resolve ) ) );
	const { unmount } = render( <RecordingModal onClose={ jest.fn() } onRecorded={ jest.fn() } /> );
	unmount();
	await act( async () => grant( stream ) );
	expect( stopTrack ).toHaveBeenCalled();
} );

it( 'keeps the recorded file local until the user chooses upload', async () => {
	const file = new File( [ 'video' ], 'recording.mp4', { type: 'video/mp4' } );
	let finish: ( file: File ) => void;
	const finished = new Promise< File >( resolve => ( finish = resolve ) );
	const stop = jest.fn( () => {
		finish( file );
		return finished;
	} );
	const cancel = jest.fn();
	jest.mocked( recordCamera ).mockReturnValue( {
		finished,
		stop,
		cancel,
		pause: jest.fn(),
		resume: jest.fn(),
	} );
	const onRecorded = jest.fn();
	const { unmount } = render( <RecordingModal onClose={ jest.fn() } onRecorded={ onRecorded } /> );
	await userEvent.click( await screen.findByRole( 'button', { name: 'Start recording' } ) );
	expect( recordCamera ).toHaveBeenCalledWith(
		expect.any( HTMLVideoElement ),
		stream,
		expect.any( Function )
	);
	await userEvent.click( screen.getByRole( 'button', { name: 'Stop recording' } ) );
	await expect(
		screen.findByRole( 'button', { name: 'Upload recording' } )
	).resolves.toBeVisible();
	expect( onRecorded ).not.toHaveBeenCalled();
	await userEvent.click( screen.getByRole( 'button', { name: 'Upload recording' } ) );
	expect( onRecorded ).toHaveBeenCalledWith( file );
	unmount();
	expect( cancel ).toHaveBeenCalled();
	expect( stopTrack ).toHaveBeenCalled();
} );

it( 'allows retrying denied permissions without uploading anything', async () => {
	getUserMedia.mockRejectedValueOnce( new DOMException( 'Permission denied', 'NotAllowedError' ) );
	const onRecorded = jest.fn();
	render( <RecordingModal onClose={ jest.fn() } onRecorded={ onRecorded } /> );
	await expect(
		within( screen.getByRole( 'dialog' ) ).findByText( /Check your browser permissions/ )
	).resolves.toBeVisible();
	await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	await expect( screen.findByRole( 'button', { name: 'Start recording' } ) ).resolves.toBeVisible();
	expect( getUserMedia ).toHaveBeenCalledTimes( 2 );
	expect( onRecorded ).not.toHaveBeenCalled();
} );

it( 'mirrors the camera monitor by default and allows turning mirroring off', async () => {
	render( <RecordingModal onClose={ jest.fn() } onRecorded={ jest.fn() } /> );
	expect( screen.getByLabelText( 'Camera preview' ) ).toHaveStyle( { transform: 'scaleX(-1)' } );
	await userEvent.click( screen.getByRole( 'button', { name: 'Mirror preview' } ) );
	expect( screen.getByLabelText( 'Camera preview' ) ).not.toHaveStyle( {
		transform: 'scaleX(-1)',
	} );
} );

it( 'keeps the selected effect current while recording', async () => {
	jest.mocked( recordCamera ).mockReturnValue( {
		finished: new Promise( () => {} ),
		stop: jest.fn(),
		cancel: jest.fn(),
		pause: jest.fn(),
		resume: jest.fn(),
	} );
	render( <RecordingModal onClose={ jest.fn() } onRecorded={ jest.fn() } /> );
	const mono = await screen.findByRole( 'button', { name: 'Mono effect' } );

	await userEvent.click( mono );
	await userEvent.click( screen.getByRole( 'button', { name: 'Start recording' } ) );
	const getEffect = jest.mocked( recordCamera ).mock.calls[ 0 ][ 2 ];
	expect( getEffect() ).toBe( 'mono' );
	await userEvent.click( screen.getByRole( 'button', { name: 'Warm effect' } ) );
	expect( getEffect() ).toBe( 'warm' );
	expect( screen.getByRole( 'button', { name: 'Warm effect' } ) ).toHaveAttribute(
		'aria-pressed',
		'true'
	);
} );

it( 'does not request a camera when the uploader-compatible format is unavailable', async () => {
	jest.mocked( getRecordingMimeType ).mockReturnValue( undefined );
	render( <RecordingModal onClose={ jest.fn() } onRecorded={ jest.fn() } /> );
	await expect(
		within( screen.getByRole( 'dialog' ) ).findByText( /recording is unavailable/ )
	).resolves.toBeVisible();
	expect( getUserMedia ).not.toHaveBeenCalled();
} );
