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

const useAiFeaturePlanType = currentTier => {
	if ( currentTier?.value === 0 ) {
		return 'free';
	}
	if ( currentTier?.value === 1 ) {
		return 'unlimited';
	}

	return 'tiered';
};

const useAiFeatureDaysUntilReset = nextStartDate => {
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

	return Math.floor( differenceInMiliseconds / ( 1000 * 60 * 60 * 24 ) );
};

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const {
		hasFeature,
		requestsCount: allTimeRequestsCount,
		requestsLimit: freeRequestsLimit,
		isOverLimit,
		usagePeriod,
		currentTier,
	} = useAiFeature();
	const planType = useAiFeaturePlanType( currentTier );
	const daysUntilReset = useAiFeatureDaysUntilReset( usagePeriod?.nextStart );

	const requestsCount = planType === 'tiered' ? usagePeriod?.requestsCount : allTimeRequestsCount;
	const requestsLimit = planType === 'free' ? freeRequestsLimit : currentTier?.limit;

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

				{ ! hasFeature && canUpgrade && (
					<Button
						variant="primary"
						label="Upgrade your Jetpack AI plan"
						href={ checkoutUrl }
						onClick={ autosaveAndRedirect }
						disabled={ isRedirecting }
					>
						{ __( 'Upgrade', 'jetpack' ) }
					</Button>
				) }
			</>
		</div>
	);
}
