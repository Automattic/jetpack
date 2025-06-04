import { useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Nudge } from '@automattic/jetpack-shared-extension-utils/components';
import { __ } from '@wordpress/i18n';

export const UpsellNudge = ( { requiredPlan } ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( requiredPlan );
	return (
		<div className="jetpack-forms-upsell-nudge">
			<Nudge
				className=""
				title={ __( 'Upgrade to a paid plan to use file uploads.', 'jetpack-forms' ) }
				buttonText={ __( 'Upgrade', 'jetpack-forms' ) }
				checkoutUrl={ checkoutUrl }
				isRedirecting={ isRedirecting }
				goToCheckoutPage={ goToCheckoutPage }
			/>
		</div>
	);
};
