import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Nudge } from '@automattic/jetpack-shared-extension-utils/components';
import { __ } from '@wordpress/i18n';

/**
 * An upgrade banner for a paid form feature.
 *
 * @param {object} props              - Component props.
 * @param {string} props.requiredPlan - Plan slug the checkout link upgrades to.
 * @param {string} props.title        - Banner heading.
 * @param {string} props.description  - Optional banner body.
 * @param {string} props.block        - Block name reported in the upgrade Tracks event.
 * @param {string} props.context      - Where the nudge renders, reported in the same event.
 * @return {object} The rendered nudge.
 */
export const UpsellNudge = ( { requiredPlan, title, description, block, context } ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( requiredPlan, () => {
		// This mimics the logic on jetpack/extensions/extended-blocks/paid-blocks/utils.js
		jetpackAnalytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
			plan: requiredPlan,
			context,
			block,
		} );
	} );
	return (
		<Nudge
			className=""
			title={ title }
			description={ description }
			buttonText={ __( 'Upgrade', 'jetpack-forms' ) }
			checkoutUrl={ checkoutUrl }
			isRedirecting={ isRedirecting }
			goToCheckoutPage={ goToCheckoutPage }
		/>
	);
};
