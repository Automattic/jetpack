import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FREE_TIER_AT_LIMIT_MESSAGE } from '../components/free-tier-notice/constants';
import {
	INVALID_FILE_NOTICE_ID,
	NOT_A_VIDEO_MESSAGE,
} from '../components/upload-dropzone/video-files';
import { filterVideoFiles, planVideoDrop } from '../utils/upload-drop';
import { recordUploadRefusal, type UploadRefusalLocation } from '../utils/upload-refusal-analytics';
import { useFreeTier } from './use-free-tier';
import { useUpload } from './use-upload';
import { useVideoPressUpgrade } from './use-videopress-upgrade';

/**
 * Validate selected videos against the plan limit and enqueue accepted files.
 *
 * @param location  - Handler receiving this selection.
 * @param onStarted - Receives temporary IDs for the accepted uploads.
 * @return File intake callback, returning the accepted count.
 */
export function useUploadIntake(
	location: Exclude< UploadRefusalLocation, 'library_dropzone' >,
	onStarted?: ( ids: string[] ) => void
): ( files: File[] ) => number {
	const { isFree, isUnlimited, limit, videoCount } = useFreeTier();
	const { startUpload } = useUpload();
	const { createErrorNotice } = useDispatch( noticesStore );
	const runUpgrade = useVideoPressUpgrade( 'upload_limit' );

	return useCallback(
		( files: File[] ): number => {
			const eligibleFiles = filterVideoFiles( files );
			if ( eligibleFiles.length < files.length ) {
				recordUploadRefusal( location, {
					reason: 'file_validation',
					counts: { attempted: files.length, skipped: files.length - eligibleFiles.length },
				} );
			}
			const decision = planVideoDrop( files, {
				isFree,
				isUnlimited,
				limit,
				videoCount,
			} );

			if ( decision.kind === 'no-videos' ) {
				createErrorNotice( NOT_A_VIDEO_MESSAGE, {
					id: INVALID_FILE_NOTICE_ID,
					type: 'snackbar',
				} );
				return 0;
			}

			if ( decision.kind === 'at-limit' ) {
				recordUploadRefusal( location, {
					reason: 'plan_limit',
					counts: { attempted: files.length, skipped: eligibleFiles.length },
				} );
				createErrorNotice( FREE_TIER_AT_LIMIT_MESSAGE, {
					actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
					type: 'snackbar',
				} );
				return 0;
			}

			const ids = decision.toUpload.map( file => startUpload( file ) );
			onStarted?.( ids );

			if ( decision.skipped > 0 ) {
				recordUploadRefusal( location, {
					reason: 'plan_limit',
					counts: { attempted: files.length, skipped: decision.skipped },
				} );
				createErrorNotice(
					sprintf(
						/* translators: %d: number of videos that could not be uploaded because the plan limit was reached. */
						_n(
							'%d video wasn’t uploaded because it exceeds your plan’s limit.',
							'%d videos weren’t uploaded because they exceed your plan’s limit.',
							decision.skipped,
							'jetpack-videopress-pkg'
						),
						decision.skipped
					),
					{ type: 'snackbar' }
				);
			}

			return decision.toUpload.length;
		},
		[
			location,
			isFree,
			isUnlimited,
			limit,
			videoCount,
			startUpload,
			createErrorNotice,
			runUpgrade,
			onStarted,
		]
	);
}
