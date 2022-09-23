import { MouseEvent } from 'react';
import { VideoPressVideo } from '../../types';

type VideoRowBaseProps = {
	/**
	 * className to apply to the component
	 */
	className?: string;
	/**
	 * Mark row as checked or not
	 */
	checked?: boolean;
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
	onUpdateVideoThumbnail?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateVideoPrivacy?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteVideo?: ( event: MouseEvent< HTMLButtonElement > ) => void;
};

type VideoPressVideoProps = VideoRowBaseProps & VideoPressVideo;

export type VideoRowProps = VideoPressVideoProps;
