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
	 * Show edit button
	 */
	showEditButton?: boolean;
	/**
	 * Show quick actions section.
	 */
	showQuickActions?: boolean;
	/**
	 * Callback to be invoked when clicking on the row.
	 */
	onSelect?: ( check: boolean ) => void;
	/**
	 * Callback to be invoked when clicking on the `Edit details` button.
	 */
	onVideoDetailsClick?: () => void;
};

type VideoPressVideoProps = VideoRowBaseProps & VideoPressVideo;

export type VideoRowProps = VideoPressVideoProps;
