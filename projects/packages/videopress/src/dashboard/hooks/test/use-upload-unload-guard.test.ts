import { renderHook } from '@testing-library/react';
import { useUploadUnloadGuard } from '../use-upload-unload-guard';
import type { UploadItem } from '../use-upload';

const mockUseUpload = jest.fn();
jest.mock( '../use-upload', () => ( {
	__esModule: true,
	useUpload: () => mockUseUpload(),
} ) );

/**
 * Dispatch a cancelable beforeunload event and report whether it was
 * prevented, the same signal the browser uses to decide whether to warn.
 *
 * @return Whether the event's default action was prevented.
 */
function dispatchBeforeUnload(): boolean {
	const event = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( event );
	return event.defaultPrevented;
}

const queueWith = ( status: UploadItem[ 'status' ] ): UploadItem[] => [
	{ id: '1', file: new File( [ 'x' ], 't.mp4' ), progress: 0, status },
];

describe( 'useUploadUnloadGuard', () => {
	afterEach( () => {
		mockUseUpload.mockReset();
	} );

	it( 'does not block tab close with an empty queue', () => {
		mockUseUpload.mockReturnValue( { uploadQueue: [] } );
		renderHook( () => useUploadUnloadGuard() );

		expect( dispatchBeforeUnload() ).toBe( false );
	} );

	it.each( [ 'pending', 'uploading' ] as const )(
		'blocks tab close while an upload is %s',
		status => {
			mockUseUpload.mockReturnValue( { uploadQueue: queueWith( status ) } );
			renderHook( () => useUploadUnloadGuard() );

			expect( dispatchBeforeUnload() ).toBe( true );
		}
	);

	it.each( [ 'success', 'failed' ] as const )(
		'does not block tab close once the only upload is %s',
		status => {
			mockUseUpload.mockReturnValue( { uploadQueue: queueWith( status ) } );
			renderHook( () => useUploadUnloadGuard() );

			expect( dispatchBeforeUnload() ).toBe( false );
		}
	);
} );
