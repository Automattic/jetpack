import { MouseEvent } from 'react';
import { VideoPressVideo } from '../../types';

export type VideoThumbnailProps = {
	/**
	 * className to apply to the component
	 */
	className?: string;

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

export type VideoCardProps = VideoPressVideo & {
	/**
	 * Callback to be invoked when clicking on the `Edit video details` button.
	 */
	onVideoDetailsClick?: () => void;

	/**
	 * Callback to be invoked when clicking on the `Update thumbnail` button.
	 */
	onUpdateThumbnailClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;

	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateUpdatePrivacyClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;

	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;
};
