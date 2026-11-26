/**
 * External dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

export const UPLOAD_IN_PROGRESS_NOTICE_ID = 'videopress-upload-in-progress';

// Locks held by uploader instances. The notice stays up until the last one is released.
const activeLocks = new Set();

/**
 * Stops the post from being saved, published or autosaved while a video upload is
 * in flight. The block only gets its guid when the upload finishes, so a post saved
 * before then is stored without the video.
 *
 * @param {boolean} isUploading - Whether this block has an upload in flight.
 */
export default function useLockSavingWhileUploading( isUploading ) {
	const lockName = useInstanceId( useLockSavingWhileUploading, 'videopress-upload' );
	const { lockPostSaving, unlockPostSaving, lockPostAutosaving, unlockPostAutosaving } =
		useDispatch( editorStore ) ?? {};
	const { createWarningNotice, removeNotice } = useDispatch( noticesStore ) ?? {};

	useEffect( () => {
		// The editor store is missing outside the post editor (e.g. the widgets screen).
		if ( ! isUploading || ! lockPostSaving ) {
			return;
		}

		lockPostSaving( lockName );
		lockPostAutosaving?.( lockName );
		activeLocks.add( lockName );
		createWarningNotice?.(
			__( 'Finish your video upload to save or publish this post.', 'jetpack-videopress-pkg' ),
			{ id: UPLOAD_IN_PROGRESS_NOTICE_ID, isDismissible: false }
		);

		return () => {
			unlockPostSaving?.( lockName );
			unlockPostAutosaving?.( lockName );
			activeLocks.delete( lockName );
			if ( activeLocks.size === 0 ) {
				removeNotice?.( UPLOAD_IN_PROGRESS_NOTICE_ID );
			}
		};
	}, [
		isUploading,
		lockName,
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
		createWarningNotice,
		removeNotice,
	] );
}
