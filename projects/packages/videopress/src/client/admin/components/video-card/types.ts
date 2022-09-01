export type VideoThumbnailProps = {
	/**
	 * Video thumbnial image
	 */
	thumbnail: string;

	/**
	 * Video duration. Number, in milliseconds.
	 */
	duration?: number;

	/**
	 * Whether is possible to edit the thumbnail
	 */
	editable?: boolean;
};

export type VideoThumbnailDropdownProps = {
	/**
	 * Callback to be invoked when clicking on the `Use default thumbnail` dropdown menu option.
	 */
	onUseDefaultThumbnail?: () => void;

	/**
	 * Callback to be invoked when clicking on the `Select from video` dropdown menu option.
	 */
	onSelectFromVideo?: () => void;

	/**
	 * Callback to be invoked when clicking on the `Upload image` dropdown menu option.
	 */
	onUploadImage?: () => void;
};

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
	 * Video uploaded date
	 */
	uploadDate: string;
};

export type VideoPressVideoProp = {
	id: number | string;
	title: string;
	uploadDate: string;
	posterImage?: string;
	duration?: number;
	plays?: number;
	isPrivate?: boolean;
};
