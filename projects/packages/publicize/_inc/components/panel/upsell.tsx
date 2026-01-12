import { getRequiredPlan, useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';

/**
 * Upsell notice for the Publicize feature.
 *
 * @return The upsell notice.
 */
export function UpsellNotice() {
	const { isRePublicizeFeatureAvailable } = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ , goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( `${ requiredPlan }` );
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * Publicize:
	 * When post is not published yet,
	 * or when the feature flag is disabled,
	 * just bail early.
	 */
	if ( ! isPostPublished || ( isPostPublished && isRePublicizeFeatureAvailable ) ) {
		return null;
	}

	// Define plan name, with a fallback value.
	const planName =
		planData?.product_name || _x( 'paid', 'The plan type - paid vs free', 'jetpack-publicize-pkg' );

	// This is here to avoid the build minification error
	const buttonText = __( 'Upgrade now', 'jetpack-publicize-pkg' );

	return (
		<Notice
			status="info"
			isDismissible={ false }
			actions={ [
				{
					label: isRedirecting ? __( 'Redirecting…', 'jetpack-publicize-pkg' ) : buttonText,
					variant: 'primary',
					className: 'is-compact',
					onClick: goToCheckoutPage,
				},
			] }
		>
			{ sprintf(
				/* translators: %s: the product name of the plan. */
				__( 'To re-share a post, you need to upgrade to the %s plan', 'jetpack-publicize-pkg' ),
				planName
			) }
		</Notice>
	);
}
