import { VideoPressVideo } from '../../types';
import { VideoQuickActionsProps } from '../video-quick-actions/types';
import { VideoThumbnailProps } from '../video-thumbnail/types';

export type VideoCardProps = Pick< VideoPressVideo, 'title' | 'plays' | 'id' > &
	VideoThumbnailProps &
	VideoQuickActionsProps & {
		/**
		 * Should show or not quick actions.
		 */
		showQuickActions?: boolean;
		/**
		 * Callback to be invoked when clicking on the `Edit video details` button.
		 */
		onVideoDetailsClick?: () => void;

		/**
		 * True when the video is being deleted.
		 */
		isDeleting?: boolean;

		/**
		 * True when is in loading mode.
		 */
		loading?: boolean;

		/**
		 * True when is in uploading mode.
		 */
		uploading?: boolean;

		/**
		 * True when is uploading a poster image.
		 */
		isUpdatingPoster?: boolean;

		/**
		 * True when is in processing mode.
		 */
		processing?: boolean;

		/**
		 * True when the video has been deleted in the server-side.
		 */
		hasBeenDeleted?: boolean;
	};
