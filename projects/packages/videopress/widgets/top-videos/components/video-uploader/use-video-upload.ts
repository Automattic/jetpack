/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { createUploadAnalytics } from '../../../../src/client/lib/upload-analytics';
import { startVideoUpload } from '../../../../src/dashboard/utils/start-video-upload';
import type { VideoMediaProps } from '../../../../src/client/lib/resumable-file-uploader/types';
import type { UploadAnalytics } from '../../../../src/client/lib/upload-analytics';

export type UploadPhase =
	| { status: 'idle' }
	| { status: 'uploading'; file: File; progress: number }
	| { status: 'failed'; file: File }
	| { status: 'uploaded'; file: File; media: VideoMediaProps };

/**
 * Runs the widget's upload and holds its phase, so the caller can keep the upload on
 * screen while the stats around it reload or fail.
 *
 * @param onUploaded - Called once the upload lands, with the media it created.
 * @return The upload phase and the function that starts an upload.
 */
export function useVideoUpload( onUploaded: ( media: VideoMediaProps ) => void ) {
	const [ phase, setPhase ] = useState< UploadPhase >( { status: 'idle' } );
	const attempt = useRef< AbortController | null >( null );
	const recordings = useRef( new WeakMap< File, UploadAnalytics >() );

	// Leaving the widget stops the upload; tus keeps it resumable for the same file.
	useEffect( () => () => attempt.current?.abort(), [] );

	const upload = useCallback(
		( file: File ) => {
			let analytics = recordings.current.get( file );
			if ( ! analytics || analytics.isComplete() ) {
				analytics = createUploadAnalytics( file, 'analytics_widget' );
				recordings.current.set( file, analytics );
			}
			attempt.current = new AbortController();
			setPhase( { status: 'uploading', file, progress: 0 } );
			void startVideoUpload(
				file,
				{
					onProgress: ( sent, total ) =>
						setPhase( current =>
							current.status === 'uploading'
								? { ...current, progress: total > 0 ? sent / total : 0 }
								: current
						),
					onSuccess: media => {
						setPhase( { status: 'uploaded', file, media } );
						onUploaded( media );
					},
					onError: () => setPhase( { status: 'failed', file } ),
				},
				{ signal: attempt.current.signal, analytics }
			);
		},
		[ onUploaded ]
	);

	return { phase, upload };
}
