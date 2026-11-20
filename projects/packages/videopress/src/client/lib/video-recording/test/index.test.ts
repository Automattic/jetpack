import { getRecordingMimeType, recordStream } from '..';

describe( 'camera recording', () => {
	const originalRecorder = global.MediaRecorder;
	let recorder;
	let stopTrack: jest.Mock;
	let stream: MediaStream;

	beforeEach( () => {
		stopTrack = jest.fn();
		stream = { getTracks: () => [ { stop: stopTrack } ] } as unknown as MediaStream;
		global.MediaRecorder = class {
			static isTypeSupported = jest.fn( type => type === 'video/mp4' );
			state = 'inactive';
			ondataavailable;
			onstop;
			onerror;
			constructor() {
				// eslint-disable-next-line @typescript-eslint/no-this-alias -- Expose the fake device to simulate asynchronous failure.
				recorder = this;
			}
			start() {
				this.state = 'recording';
			}
			stop() {
				this.state = 'inactive';
				this.ondataavailable( { data: new Blob( [ 'video' ], { type: 'video/mp4' } ) } );
				this.onstop();
			}
		} as unknown as typeof MediaRecorder;
	} );

	afterEach( () => {
		global.MediaRecorder = originalRecorder;
	} );

	it( 'returns the final video chunk as an MP4 file and releases the camera', async () => {
		const recording = recordStream( stream );
		const file = await recording.stop();
		expect( file.name ).toMatch( /\.mp4$/ );
		expect( file.type ).toBe( 'video/mp4' );
		expect( file.size ).toBe( 5 );
		expect( stopTrack ).toHaveBeenCalled();
	} );

	it( 'discards cancelled recordings and releases the camera', async () => {
		const recording = recordStream( stream );
		recording.cancel();
		await expect( recording.stop() ).rejects.toThrow( 'No video was recorded' );
		expect( stopTrack ).toHaveBeenCalled();
	} );

	it( 'rejects device failures even when they happen before stop', async () => {
		const recording = recordStream( stream );
		recorder.onerror();
		await expect( recording.stop() ).rejects.toThrow( 'Video recording failed' );
		expect( stopTrack ).toHaveBeenCalled();
	} );

	it( 'does not disguise an unsupported recording container as MP4', () => {
		jest.mocked( MediaRecorder.isTypeSupported ).mockReturnValue( false );
		expect( getRecordingMimeType() ).toBeUndefined();
		expect( () => recordStream( stream ) ).toThrow();
		expect( stopTrack ).toHaveBeenCalled();
	} );
} );
