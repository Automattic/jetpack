/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../../../blocks/ai-assistant/lib/connection';
import UsageControl from '../usage-bar';
import './style.scss';
import { PLAN_TYPE_FREE, PLAN_TYPE_TIERED, PLAN_TYPE_UNLIMITED } from '../usage-bar/types';
import type { PlanType } from '../usage-bar/types';

/**
 * Simple hook to get the plan type from the current tier
 *
 * @param {object} currentTier - the current tier from the AI Feature data
 * @returns {PlanType} the plan type
 */
const usePlanType = ( currentTier ): PlanType => {
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

/**
 * Simple hook to get the days until the next reset
 *
 * @param {string} nextStartDate - the next start date from the AI Feature data
 * @returns {number} an integer with the days until the next reset
 */
const useDaysUntilReset = ( nextStartDate: string ): number => {
	// Bail early if we don't have a next start date
	if ( ! nextStartDate ) {
		return null;
	}

	// Build an object from the next start date
	const parsedNextStartDate = new Date( nextStartDate );

	/*
	 * Get the miliseconds difference between now and the next start date
	 * nextStartDate is in UTC, so we need to use UTC methods.
	 */
	const differenceInMiliseconds =
		Date.UTC(
			parsedNextStartDate.getFullYear(),
			parsedNextStartDate.getMonth(),
			parsedNextStartDate.getDate()
		) - Date.now();

	/*
	 * Convert the difference in miliseconds to days. Use ceil to round up,
	 * counting partial days as a full day.
	 */
	return Math.ceil( differenceInMiliseconds / ( 1000 * 60 * 60 * 24 ) );
};

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const {
		requestsCount: allTimeRequestsCount,
		requestsLimit: freeRequestsLimit,
		isOverLimit,
		usagePeriod,
		currentTier,
	} = useAiFeature();
	const planType = usePlanType( currentTier );
	const daysUntilReset = useDaysUntilReset( usagePeriod?.nextStart );

	const requestsCount =
		planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;
	const requestsLimit = planType === PLAN_TYPE_FREE ? freeRequestsLimit : currentTier?.limit;

	return (
		<div className="jetpack-ai-usage-panel">
			<>
				<UsageControl
					isOverLimit={ isOverLimit }
					requestsCount={ requestsCount }
					requestsLimit={ requestsLimit }
					daysUntilReset={ daysUntilReset }
					planType={ planType }
				/>

				{ ( planType === PLAN_TYPE_FREE || planType === PLAN_TYPE_TIERED ) && canUpgrade && (
					<div className="jetpack-ai-usage-panel-upgrade-button">
						<Button
							variant="primary"
							label="Upgrade your Jetpack AI plan"
							href={ checkoutUrl }
							onClick={ autosaveAndRedirect }
							disabled={ isRedirecting }
						>
							{ __( 'Upgrade', 'jetpack' ) }
						</Button>
					</div>
				) }
			</>
		</div>
	);
}
