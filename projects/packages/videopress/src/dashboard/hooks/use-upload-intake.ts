import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { FREE_TIER_AT_LIMIT_MESSAGE } from '../components/free-tier-notice';
import {
	INVALID_FILE_NOTICE_ID,
	NOT_A_VIDEO_MESSAGE,
} from '../components/upload-dropzone/video-files';
import { planVideoDrop } from '../utils/upload-drop';
import { useFreeTier } from './use-free-tier';
import { useUpload } from './use-upload';
import { useVideoPressUpgrade } from './use-videopress-upgrade';

/**
 * The shared multi-file upload entry point behind every "give me your files"
 * surface — the Library's DropZone, its header "Upload video" picker, and the
 * welcome modal's primary CTA. Enforces the free-tier cap up front so no
 * surface can sneak past the limit, and raises the same notices from all of
 * them.
 *
 * @return A callback that plans and starts uploads for a picked or dropped
 * file set, returning how many uploads it actually started — 0 when the whole
 * selection was refused (with the refusal already surfaced as a notice).
 */
export function useUploadIntake(): ( files: File[] ) => number {
	const { isFree, isUnlimited, limit, videoCount } = useFreeTier();
	const { startUpload } = useUpload();
	const { createErrorNotice } = useGlobalNotices();
	const runUpgrade = useVideoPressUpgrade();

	return useCallback(
		( files: File[] ): number => {
			const decision = planVideoDrop( files, {
				isFree,
				isUnlimited,
				limit,
				videoCount,
			} );

			if ( decision.kind === 'no-videos' ) {
				createErrorNotice( NOT_A_VIDEO_MESSAGE, { id: INVALID_FILE_NOTICE_ID } );
				return 0;
			}

			if ( decision.kind === 'at-limit' ) {
				createErrorNotice( FREE_TIER_AT_LIMIT_MESSAGE, {
					actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
				} );
				return 0;
			}

			decision.toUpload.forEach( file => startUpload( file ) );

			if ( decision.skipped > 0 ) {
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
					)
				);
			}

			return decision.toUpload.length;
		},
		[ isFree, isUnlimited, limit, videoCount, startUpload, createErrorNotice, runUpgrade ]
	);
}
