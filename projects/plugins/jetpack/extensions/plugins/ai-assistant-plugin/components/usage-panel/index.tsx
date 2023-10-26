/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { BaseControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAIFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../../../blocks/ai-assistant/lib/connection';
import UsageBar from '../usage-bar';
import './style.scss';

export default function UsagePanel() {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	// fetch usage data
	const { hasFeature, requestsCount, requestsLimit } = useAIFeature();

	// build messages
	const freeUsageMessage = sprintf(
		// translators: %1$d: current request counter; %2$d: request allowance;
		__( '%1$d / %2$d free requests.', 'jetpack' ),
		requestsCount,
		requestsLimit
	);
	const unlimitedPlanUsageMessage = sprintf(
		// translators: placeholder is the current request counter;
		__( '%d / ∞ requests.', 'jetpack' ),
		requestsCount
	);

	/*
	 * Calculate usage. When hasFeature is true, the user has the paid plan,
	 * that grants unlimited requests for now. To show something meaningful in
	 * the usage bar, we use a very low usage value.
	 */
	const usage = hasFeature ? 0.1 : requestsCount / requestsLimit;

	const help = hasFeature ? __( 'Unlimited requests for your site', 'jetpack' ) : undefined;

	return (
		<BaseControl
			className="jetpack-ai-usage-panel-control"
			label={ __( 'Usage', 'jetpack' ) }
			help={ help }
		>
			<p>{ hasFeature ? unlimitedPlanUsageMessage : freeUsageMessage }</p>

			{ ! hasFeature && <UsageBar usage={ usage } /> }

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
		</BaseControl>
	);
}
