/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../../../blocks/ai-assistant/lib/connection';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
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

/**
 * Handle the upgrade button text.
 *
 * @param {PlanType} planType - the type of the current plan
 * @param {number} nextTierRequestLimit - the request limit of the next tier, or null if there is no next tier
 * @returns {string} the proper upgrade button text
 */
const useUpgradeButtonText = ( planType: PlanType, nextTierRequestLimit: number ): string => {
	// If the current plan is free, the upgrade button text is just "Upgrade"
	if ( planType === PLAN_TYPE_FREE ) {
		return __( 'Upgrade', 'jetpack' );
	}

	// If there is no next tier, the upgrade button text is just "Get more requests"
	if ( ! nextTierRequestLimit ) {
		return __( 'Get more requests', 'jetpack' );
	}

	// In other cases, the upgrade button text is "Get %d requests"
	return sprintf(
		// translators: %1$d: an integer, the number of requests to upgrade to on the next tier
		__( 'Get %1$d requests', 'jetpack' ),
		nextTierRequestLimit
	);
};

/**
 * Helper to get the Contact Us URL
 * @returns {object} an object with the Contact Us URL, the autosaveAndRedirect function and a boolean indicating if we are redirecting
 */
const useContactUsLink = (): {
	contactUsURL: string;
	autosaveAndRedirectContactUs: () => void;
	isRedirectingContactUs: boolean;
} => {
	const contactUsURL = getRedirectUrl( 'jetpack-ai-tiers-more-requests-contact' );
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( contactUsURL );

	return {
		contactUsURL,
		autosaveAndRedirectContactUs: autosaveAndRedirect,
		isRedirectingContactUs: isRedirecting,
	};
};

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const { contactUsURL, autosaveAndRedirectContactUs } = useContactUsLink();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const {
		requestsCount: allTimeRequestsCount,
		requestsLimit: freeRequestsLimit,
		isOverLimit,
		usagePeriod,
		currentTier,
		nextTier,
	} = useAiFeature();
	const planType = usePlanType( currentTier );
	const daysUntilReset = useDaysUntilReset( usagePeriod?.nextStart );

	const requestsCount =
		planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;
	const requestsLimit = planType === PLAN_TYPE_FREE ? freeRequestsLimit : currentTier?.limit;

	// Determine the upgrade button text
	const upgradeButtonText = useUpgradeButtonText( planType, nextTier?.limit );

	// Handle upgrade for simple and atomic sites on the last plan
	const showContactUsCallToAction =
		( isSimpleSite() || isAtomicSite() ) && planType === PLAN_TYPE_TIERED && ! nextTier;

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
						{ showContactUsCallToAction && (
							<>
								<p>{ __( 'Need more requests?', 'jetpack' ) }</p>
								<Button
									variant="primary"
									label={ __( 'Contact us for more requests', 'jetpack' ) }
									href={ contactUsURL }
									onClick={ autosaveAndRedirectContactUs }
								>
									{ __( 'Contact Us', 'jetpack' ) }
								</Button>
							</>
						) }
						{ ! showContactUsCallToAction && (
							<Button
								variant="primary"
								label={ __( 'Upgrade your Jetpack AI plan', 'jetpack' ) }
								href={ checkoutUrl }
								onClick={ autosaveAndRedirect }
								disabled={ isRedirecting }
							>
								{ upgradeButtonText }
							</Button>
						) }
					</div>
				) }
			</>
		</div>
	);
}
