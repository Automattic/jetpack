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
	requestsCount: number;
	requestsLimit: number;
	isOverLimit: boolean;
	planType: 'free' | 'tiered' | 'unlimited';
	daysUntilReset: number;
};
