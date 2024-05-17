export const PLAN_TYPE_FREE = 'free';
export const PLAN_TYPE_TIERED = 'tiered';
export const PLAN_TYPE_UNLIMITED = 'unlimited';

export type PlanType = typeof PLAN_TYPE_FREE | typeof PLAN_TYPE_TIERED | typeof PLAN_TYPE_UNLIMITED;

/**
 * Simple hook to get the plan type from the current tier
 *
 * @param {object} currentTier - the current tier from the AI Feature data
 * @returns {PlanType} the plan type
 */
export const usePlanType = ( currentTier ): PlanType => {
	if ( ! currentTier ) {
		return null;
	}

	if ( currentTier?.value === 0 ) {
		return PLAN_TYPE_FREE;
	}

	if ( currentTier?.value === 1 ) {
		return PLAN_TYPE_UNLIMITED;
	}

	return PLAN_TYPE_TIERED;
};
