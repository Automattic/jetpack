import type { VideoRowProps } from '../video-row';

export type VideoListProps = {
	/**
	 * List of videos.
	 */
	videos: Array<
		Omit<
			VideoRowProps,
			| 'checked'
			| 'hideEditButton'
			| 'hideQuickActions'
			| 'onSelect'
			| 'onClickEdit'
			| 'onUpdateThumbnailClick'
			| 'onUpdateUpdatePrivacyClick'
			| 'onDeleteClick'
		>
	>;
	/**
	 * Hide privacy column.
	 */
	hidePrivacy?: boolean;
	/**
	 * Hide duration column.
	 */
	hideDuration?: boolean;
	/**
	 * Hide plays column.
	 */
	hidePlays?: boolean;
	/**
	 * Hide edit details button.
	 */
	hideEditButton?: boolean;
	/**
	 * Hide quick actions section.
	 */
	hideQuickActions?: boolean;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onClickEdit?: ( video: VideoRowProps ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update thumbnail` button.
	 */
	onUpdateThumbnailClick?: ( video: VideoRowProps ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateUpdatePrivacyClick?: ( video: VideoRowProps ) => void;
	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteClick?: ( video: VideoRowProps ) => void;
};
