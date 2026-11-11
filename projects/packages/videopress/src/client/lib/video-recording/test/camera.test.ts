import { recordStream } from '..';
import { recordCamera } from '../camera';
import { drawRecordingFrame } from '../effects';
import type { RecordingEffect } from '../effects';

jest.mock( '..', () => ( { recordStream: jest.fn() } ) );
jest.mock( '../effects', () => ( { drawRecordingFrame: jest.fn() } ) );

/**
 * Supply a camera and output stream without real media devices.
 *
 * @return Capture fixtures and frame callbacks.
 */
function cameraFixture() {
	const cameraTrack = Object.assign( new EventTarget(), { stop: jest.fn() } );
	const canvasTrack = { stop: jest.fn() };
	const camera = {
		getTracks: () => [ cameraTrack ],
		getAudioTracks: () => [],
	} as unknown as MediaStream;
	const output = { getTracks: () => [ canvasTrack ] } as unknown as MediaStream;
	const context = {} as CanvasRenderingContext2D;
	const canvas = document.createElement( 'canvas' );
	Object.defineProperties( canvas, {
		getContext: { value: () => context },
		captureStream: { value: () => output },
	} );
	const video = {
		ownerDocument: {
			createElement: () => canvas,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		},
		videoWidth: 640,
		videoHeight: 480,
		readyState: 4,
	} as unknown as HTMLVideoElement;
	jest.mocked( recordStream ).mockReturnValue( {
		finished: new Promise( () => {} ),
		stop: jest.fn(),
		cancel: jest.fn(),
		pause: jest.fn(),
		resume: jest.fn(),
	} );
	const requestFrame = jest.spyOn( window, 'requestAnimationFrame' ).mockReturnValue( 42 );
	const cancelFrame = jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation();
	return { video, camera, output, context, cameraTrack, canvasTrack, requestFrame, cancelFrame };
}

afterEach( () => jest.restoreAllMocks() );

it( 'captures changes to the effect instead of freezing the preset selected at startup', () => {
	const { video, camera, context, requestFrame } = cameraFixture();
	let effect: RecordingEffect = 'mono';
	const recording = recordCamera( video, camera, () => effect );
	effect = 'warm';
	requestFrame.mock.calls[ 0 ][ 0 ]( 0 );
	expect( drawRecordingFrame ).toHaveBeenLastCalledWith( context, video, 'warm' );
	recording.cancel();
} );

it( 'releases both the raw camera and rendered output tracks on cancellation', () => {
	const { video, camera, cameraTrack, canvasTrack, cancelFrame } = cameraFixture();
	const recording = recordCamera( video, camera, () => 'original' );
	recording.cancel();
	expect( cameraTrack.stop ).toHaveBeenCalled();
	expect( canvasTrack.stop ).toHaveBeenCalled();
	expect( cancelFrame ).toHaveBeenCalledWith( 42 );
} );
