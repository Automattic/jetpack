import type { VideoRowProps } from '../video-row';

export type VideoListProps = {
	/**
	 * List of videos.
	 */
	videos: Array<
		Omit<
			VideoRowProps,
			'checked' | 'showEditButton' | 'showQuickActions' | 'onSelect' | 'onVideoDetailsClick'
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
	 * Show edit button.
	 */
	showEditButton?: boolean;
	/**
	 * Show quick actions.
	 */
	showQuickActions?: boolean;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onVideoDetailsClick?: ( video: VideoRowProps ) => void;
};
