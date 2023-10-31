/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
/**
 * Internal dependencies
 */
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAIFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../../../blocks/ai-assistant/lib/connection';
import UsageControl from '../usage-bar';

import './style.scss';

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const { hasFeature, requestsCount, requestsLimit, isOverLimit, usagePeriod, currentTier } =
		useAIFeature();

	return (
		<div className="jetpack-ai-usage-panel">
			<UsageControl
				isOverLimit={ isOverLimit }
				hasFeature={ hasFeature }
				requestsCount={ requestsCount }
				requestsLimit={ requestsLimit }
				usagePeriod={ usagePeriod }
				currentTier={ currentTier }
			/>

			{ ! hasFeature && canUpgrade && (
				<Button
					variant="primary"
					label="Upgrade your Jetpack AI plan"
					href={ checkoutUrl }
					onClick={ autosaveAndRedirect }
					disabled={ isRedirecting }
				>
					Upgrade
				</Button>
			) }
		</div>
	);
}
