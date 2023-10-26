export type UsageBarProps = {
	/**
	 * The current usage, as a percentage represented by a number between 0 and 1.
	 */
	usage: number;

	/**
	 * True if the usage is over the limit.
	 */
	limitReached: boolean;
};

export type UsageControlProps = {
	/**
	 * The current usage, as a percentage represented by a number between 0 and 1.
	 */
	usage: number;

	/**
	 * True if the usage is over the limit.
	 */
	isOverLimit: boolean;

	/**
	 * True if the AI Assistant feature is supported.
	 */
	hasFeature: boolean;
};
