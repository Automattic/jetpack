import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button, ToolbarButton } from '@wordpress/components';
import { _x, __ } from '@wordpress/i18n';

/**
 * Apply HTML encoding for special characters inside shortcode attributes.
 *
 * @see https://codex.wordpress.org/Shortcode_API#Attributes
 * @param {string} value - Value to encode.
 * @returns {string} Encoded value.
 */
export const encodeValueForShortcodeAttribute = value => {
	return value
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#039;' )
		.replace( /\[/g, '&#091;' )
		.replace( /\]/g, '&#093;' )
		.replace( /\u00a0/g, '&nbsp;' )
		.replace( /\u200b/g, '&#x200b;' );
};

export const getPaidPlanLink = hasNewsletterPlans => {
	const link = 'https://wordpress.com/earn/payments-plans/' + location.hostname;
	return hasNewsletterPlans ? link : link + '#add-newsletter-payment-plan';
};

export const isNewsletterFeatureEnabled = () => {
	return getJetpackData()?.jetpack?.is_newsletter_feature_enabled ?? false;
};

export const isNewsletterConfigured = () => {
	return getJetpackData()?.jetpack?.is_newsletter_configured ?? false;
};

export default function GetAddPaidPlanButton( { context = 'other', hasNewsletterPlans } ) {
	const addPaidPlanButtonText = hasNewsletterPlans
		? _x( 'Manage plans', 'unused context to distinguish translations', 'jetpack' )
		: __( 'Add Payments', 'jetpack' );

	if ( 'toolbar' === context ) {
		return (
			<ToolbarButton href={ getPaidPlanLink( hasNewsletterPlans ) } target="_blank">
				{ addPaidPlanButtonText }
			</ToolbarButton>
		);
	}

	return (
		<Button variant="primary" href={ getPaidPlanLink( hasNewsletterPlans ) } target="_blank">
			{ addPaidPlanButtonText }
		</Button>
	);
}
