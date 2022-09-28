import { VideoPressVideo } from '../../types';

export type VideoGridProps = {
	/**
	 * Array of VideoPressVideo objects
	 */
	videos: Array< VideoPressVideo >;

	/**
	 * Callback to be called when click on Edit Details
	 */
	onVideoDetailsClick?: ( video: VideoPressVideo ) => void;

	/**
	 * Count of videos to render into the grid
	 *
	 * @default 6
	 */
	count?: number;
};
