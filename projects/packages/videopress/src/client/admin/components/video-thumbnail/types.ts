import React from 'react';

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

export type VideoThumbnailProps = VideoThumbnailDropdownProps & {
	/**
	 * className to apply to the component
	 */
	className?: string;

	/**
	 * Video thumbnial image
	 */
	thumbnail?: string | React.ReactNode;

	/**
	 * Video duration. Number, in milliseconds.
	 */
	duration?: number;

	/**
	 * Whether is possible to edit the thumbnail
	 */
	editable?: boolean;

	/**
	 * Blank icon size
	 */
	blankIconSize?: number;
};
