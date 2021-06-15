/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useUpgradeFlow from '../../shared/use-upgrade-flow/index';
import { Nudge } from '../../shared/components/upgrade-nudge';

export const UPGRADE_NUDGE_TITLE = __( 'Premium Block', 'jetpack' );
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
	description = UPGRADE_NUDGE_DESCRIPTION,
	buttonText = UPGRADE_NUDGE_BUTTON_TEXT,
	visible = true,
	requiredPlan,
	context,
} ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow(
		requiredPlan,
		onRedirect
	);

	return (
		<Nudge
			align={ align }
			buttonText={ buttonText }
			checkoutUrl={ checkoutUrl }
			className={ className }
			context={ context }
			description={ description }
			goToCheckoutPage={ goToCheckoutPage }
			isRedirecting={ isRedirecting }
			title={ title }
			visible={ visible }
		/>
	);
};

export default UpgradePlanBanner;
