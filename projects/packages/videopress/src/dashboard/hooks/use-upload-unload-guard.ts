import { useEffect } from '@wordpress/element';
import { useUpload } from './use-upload';

/**
 * Warn before the user leaves the page while an upload is in flight.
 * The upload queue is a window-attached singleton, so this guard applies
 * regardless of which route started the upload.
 */
export function useUploadUnloadGuard(): void {
	const { uploadQueue } = useUpload();
	const hasInFlightUpload = uploadQueue.some(
		item => item.status === 'pending' || item.status === 'uploading'
	);

	useEffect( () => {
		if ( ! hasInFlightUpload ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Chrome still requires returnValue to be set.
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ hasInFlightUpload ] );
}
