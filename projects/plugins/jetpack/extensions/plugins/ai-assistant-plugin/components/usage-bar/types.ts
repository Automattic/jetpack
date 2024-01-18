import { PlanType } from '../../../../shared/use-plan-type';

export type UsageBarProps = {
	/**
	 * The current usage, as a percentage represented by a number between 0 and 1.
	 */
	usage: number;

	/**
	 * True if the usage is over the limit.
	 */
	limitReached: boolean;

	/**
	 * True if an upgrade is required.
	 */
	requireUpgrade: boolean;
};

export type UsageControlProps = {
	requestsCount: number;
	requestsLimit: number;
	isOverLimit: boolean;
	planType: PlanType;
	daysUntilReset: number;
	requireUpgrade: boolean;
};
