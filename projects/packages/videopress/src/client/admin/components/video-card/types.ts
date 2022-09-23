import { MouseEvent } from 'react';
import { VideoPressVideo } from '../../types';
import { VideoThumbnailProps } from '../video-thumbnail/types';

export type VideoCardProps = VideoPressVideo &
	VideoThumbnailProps & {
		/**
		 * Whether the card should look "blank" style.
		 */
		isBlank?: boolean;

		/**
		 * True when the card is loading data.
		 */
		isLoading?: boolean;

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
