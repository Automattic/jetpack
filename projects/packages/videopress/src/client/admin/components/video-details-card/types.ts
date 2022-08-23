export type VideoDetailsCardProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Video filename.
	 */
	filename: string;

	/**
	 * Video source file URL.
	 */
	src: string;

	/**
	 * Video thumbnial image
	 */
	thumbnail: string;

	/**
	 * Video uploaded date
	 */
	uploadDate: string;

	/**
	 * Callback to be invoked when the video is changed.
	 */
	onFileChange: ( arg0: string ) => void;
};
