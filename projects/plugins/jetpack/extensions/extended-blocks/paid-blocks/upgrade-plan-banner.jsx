import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Nudge } from '../../shared/components/upgrade-nudge';
import useUpgradeFlow from '../../shared/use-upgrade-flow/index';

export const UPGRADE_NUDGE_TITLE = __( 'Premium Block', 'jetpack' );

export const /** translators: %s: name of the plan. */
	UPGRADE_NUDGE_PLAN_DESCRIPTION = __( 'Upgrade to %s to use this premium block', 'jetpack' );

export const UPGRADE_NUDGE_DESCRIPTION = __(
	'Upgrade your plan to use this premium block',
	'jetpack'
);
export const UPGRADE_NUDGE_BUTTON_TEXT = __( 'Upgrade', 'jetpack' );

const UpgradePlanBanner = ( {
	onRedirect,
	align,
	className,
	title = UPGRADE_NUDGE_TITLE,
	description = null,
	buttonText = UPGRADE_NUDGE_BUTTON_TEXT,
	visible = true,
	requiredPlan,
	context,
} ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow(
		requiredPlan,
		onRedirect
	);

	const upgradeDescription = useSelect(
		select => {
			if ( description ) {
				return description;
			}

			const planSelector = select( 'wordpress-com/plans' );
			const plan = planSelector && planSelector.getPlan( requiredPlan );
			if ( plan ) {
				return sprintf( UPGRADE_NUDGE_PLAN_DESCRIPTION, plan.product_name_short );
			}

			return null;
		},
		[ description ]
	);

	return (
		upgradeDescription && (
			<Nudge
				align={ align }
				buttonText={ buttonText }
				checkoutUrl={ checkoutUrl }
				className={ className }
				context={ context }
				description={ upgradeDescription }
				goToCheckoutPage={ goToCheckoutPage }
				isRedirecting={ isRedirecting }
				title={ title }
				visible={ visible }
			/>
		)
	);
};

export default UpgradePlanBanner;
