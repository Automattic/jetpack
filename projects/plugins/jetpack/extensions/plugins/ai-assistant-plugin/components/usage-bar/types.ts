import { PlanType } from '@automattic/jetpack-shared-extension-utils';

export type UsageBarProps = {
	/**
	 * The current usage, as a percentage represented by a number between 0 and 1.
	 */
	usage: number;
};

export type UsageControlProps = {
	requestsCount: number;
	requestsLimit: number;
	isOverLimit: boolean;
	planType: PlanType;
	nextResetDate: string;
	loading?: boolean;
};
