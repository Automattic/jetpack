import { VideoPressVideo } from '../../types';
import { VideoThumbnailProps } from '../video-thumbnail/types';

type VideoRowBaseProps = {
	/**
	 * className to apply to the component
	 */
	className?: string;
	/**
	 * Mark row as checked or not
	 */
	checked?: boolean;
	/**
	 * Show edit button
	 */
	showEditButton?: boolean;
	/**
	 * Show quick actions section.
	 */
	showQuickActions?: boolean;
	/**
	 * Loading mode.
	 */
	loading?: boolean;
	/**
	 * Callback to be invoked when clicking on the row.
	 */
	onSelect?: ( check: boolean ) => void;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onVideoDetailsClick?: () => void;
};

type VideoPressVideoProps = VideoRowBaseProps &
	Pick< VideoPressVideo, 'id' | 'title' | 'duration' | 'uploadDate' | 'plays' | 'isPrivate' > &
	Pick< VideoThumbnailProps, 'thumbnail' >;

export type VideoRowProps = VideoPressVideoProps & {
	showThumbnail?: boolean;
};
