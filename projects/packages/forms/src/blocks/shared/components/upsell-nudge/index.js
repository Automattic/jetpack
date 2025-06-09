import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Nudge } from '@automattic/jetpack-shared-extension-utils/components';
import { __ } from '@wordpress/i18n';

export const UpsellNudge = ( { requiredPlan } ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( requiredPlan, () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_file_upload_upsell_click', {
			plan: requiredPlan,
			context: 'block-editor',
		} );
	} );
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
