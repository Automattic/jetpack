import { MouseEvent } from 'react';

export type VideoPressVideo = {
	id: number | string;
	videoTitle: string;
	posterImage?: string;
	uploadDate: string;
	duration?: number;
	plays?: number;
	isPrivate?: boolean;
};

export type VideoRowProps = VideoPressVideo & {
	/**
	 * className to apply to the component
	 */
	className?: string;
	/**
	 * Mark row as checked or not
	 */
	checked: boolean;
	/**
	 * Hide edit details button.
	 */
	hideEditButton?: boolean;
	/**
	 * Hide quick actions section.
	 */
	hideQuickActions?: boolean;
	/**
	 * Callback to be invoked when clicking on the row.
	 */
	onSelect?: ( check: boolean ) => void;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onClickEdit?: () => void;
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
