import { drawRecordingFrame } from '../effects';

it( 'saves monochrome pixels even when the browser has no canvas filter support', () => {
	const image = { data: new Uint8ClampedArray( [ 200, 80, 20, 128 ] ) };
	const context = {
		canvas: { width: 1, height: 1 },
		drawImage: jest.fn(),
		getImageData: jest.fn( () => image ),
		putImageData: jest.fn(),
	} as unknown as CanvasRenderingContext2D;
	drawRecordingFrame( context, {} as HTMLVideoElement, 'mono' );
	expect( Array.from( image.data ) ).toEqual( [ 101, 101, 101, 128 ] );
	expect( context.putImageData ).toHaveBeenCalledWith( image, 0, 0 );
} );
