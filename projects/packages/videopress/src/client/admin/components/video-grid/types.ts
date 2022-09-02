import { VideoPressVideoProp } from '../video-card/types';

export type VideoGridProps = {
	/**
	 * Array of VideoPressVideo objects
	 */
	videos: Array< VideoPressVideoProp >;

	/**
	 * Count of videos to render into the grid
	 *
	 * @default 6
	 */
	count: number;
};
