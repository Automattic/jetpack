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
	 * Show action button
	 */
	showActionButton?: boolean;
	/**
	 * Show quick actions section.
	 */
	showQuickActions?: boolean;
	/**
	 * Loading mode.
	 */
	loading?: boolean;
	/**
	 * True when is uploading a poster image.
	 */
	isUpdatingPoster?: boolean;
	/**
	 * Callback to be invoked when clicking on the row.
	 */
	onSelect?: ( check: boolean ) => void;
	/**
	 * Callback to be invoked when clicking on action button.
	 */
	onActionClick?: () => void;
	/**
	 * Text to be used inside action button. Default to `Edit details`.
	 */
	actionButtonLabel?: string;
	/**
	 * Make row hoverable or not.
	 */
	hoverable?: boolean;
};

type VideoPressVideoProps = VideoRowBaseProps &
	Pick< VideoPressVideo, 'id' | 'title' > &
	Partial<
		Pick< VideoPressVideo, 'duration' | 'uploadDate' | 'plays' | 'isPrivate' | 'privacySetting' > // Optional
	> &
	Pick< VideoThumbnailProps, 'thumbnail' >;

export type VideoRowProps = VideoPressVideoProps & {
	showThumbnail?: boolean;
};
