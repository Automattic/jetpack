export type VideoStorageMeterProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Optional classname to apply to the progress bar element.
	 */
	progressBarClassName?: string;

	/**
	 * The total available space, in bytes.
	 */
	total: number;

	/**
	 * The used space, in bytes.
	 */
	used: number;
};
