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
			| 'onUpdateVideoThumbnail'
			| 'onUpdateVideoPrivacy'
			| 'onDeleteVideo'
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
	onUpdateVideoThumbnail?: ( video: VideoRowProps ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateVideoPrivacy?: ( video: VideoRowProps ) => void;
	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteVideo?: ( video: VideoRowProps ) => void;
};
