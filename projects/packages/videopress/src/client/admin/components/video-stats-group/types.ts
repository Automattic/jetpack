export type VideoStatsGroupProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * The number of uploaded videos.
	 */
	videos: number;

	/**
	 * The total number of video plays.
	 */
	plays: number;

	/**
	 * The total number of video plays of the current day.
	 */
	playsToday: number;
};
