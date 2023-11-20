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
	planType: PlanType;
	daysUntilReset: number;
};

export const PLAN_TYPE_FREE = 'free';
export const PLAN_TYPE_TIERED = 'tiered';
export const PLAN_TYPE_UNLIMITED = 'unlimited';

export type PlanType = typeof PLAN_TYPE_FREE | typeof PLAN_TYPE_TIERED | typeof PLAN_TYPE_UNLIMITED;
