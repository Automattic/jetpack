import type { VideoPressVideo } from '../video-row';

export type VideoListProps = {
	/**
	 * List of videos.
	 */
	videos: Array< VideoPressVideo >;
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
	onClickEdit?: ( video: VideoPressVideo ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update thumbnail` button.
	 */
	onUpdateThumbnailClick?: ( video: VideoPressVideo ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateUpdatePrivacyClick?: ( video: VideoPressVideo ) => void;
	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteClick?: ( video: VideoPressVideo ) => void;
};
