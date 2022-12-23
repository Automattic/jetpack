export type VideoDetailsProps = {
	/**
	 * Video filename.
	 */
	filename: string;

	/**
	 * Video source file URL.
	 */
	src: string;

	/**
	 * VideoPress embed shortcode.
	 */
	shortcode: string;

	/**
	 * Video uploaded date
	 */
	uploadDate: string;

	/**
	 * Loading mode
	 */
	loading: boolean;
};
