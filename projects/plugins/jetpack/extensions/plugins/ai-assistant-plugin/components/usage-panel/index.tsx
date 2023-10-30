/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAIFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../../../blocks/ai-assistant/lib/connection';
import UsageControl from '../usage-bar';
import './style.scss';

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const { hasFeature, requestsCount, requestsLimit, isOverLimit } = useAIFeature();

	return (
		<div className="jetpack-ai-usage-panel">
			<UsageControl
				isOverLimit={ isOverLimit }
				hasFeature={ hasFeature }
				requestsCount={ requestsCount }
				requestsLimit={ requestsLimit }
			/>

			{ false && (
				<p className="muted">
					{
						// translators: %1$d: number of days until the next usage count reset
						sprintf( __( 'Requests will reset in %1$d days.', 'jetpack' ), 10 )
					}
				</p>
			) }

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
