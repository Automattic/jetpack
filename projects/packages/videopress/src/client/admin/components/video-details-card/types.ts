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
	 * Callback to be invoked when clicking on the `Use default thumbnail` dropdown menu option.
	 */
	onUseDefaultThumbnail: () => void;

	/**
	 * Callback to be invoked when clicking on the `Select from video` dropdown menu option.
	 */
	onSelectFromVideo: () => void;

	/**
	 * Callback to be invoked when clicking on the `Upload image` dropdown menu option.
	 */
	onUploadImage: () => void;
};
