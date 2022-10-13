import { VideoPressVideo } from '../../types';

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
	 * Show edit button.
	 */
	showEditButton?: boolean;
	/**
	 * Show quick actions.
	 */
	showQuickActions?: boolean;
	/**
	 * Loading mode.
	 */
	loading?: boolean;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onVideoDetailsClick?: ( video: VideoPressVideo ) => void;
};
