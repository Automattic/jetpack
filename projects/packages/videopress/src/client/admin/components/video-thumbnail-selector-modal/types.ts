export type VideoThumbnailSelectorModalProps = {
	/**
	 * The video URL.
	 */
	url: string;

	/**
	 * The video thumbnail time.
	 */
	selectedTime: number | null;

	handleCloseSelectFrame: () => void;
	handleVideoFrameSelected: ( time: number ) => void;
	handleConfirmFrame: () => void;
};
