import { VideoCardProps } from '../video-card/types';

export type VideoGridProps = {
	/**
	 * Array of VideoPressVideo objects
	 */
	videos: Array< VideoCardProps >;

	/**
	 * Callback to be called when click on Edit Details
	 */
	onVideoDetailsClick?: ( video: VideoCardProps ) => void;

	/**
	 * Count of videos to render into the grid
	 *
	 * @default 6
	 */
	count?: number;
};
