import { Button, ToolbarButton } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';

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

function GetAddPaidPlanButton( { context = 'other', hasNewsletterPlans } ) {
	const addPaidPlanButtonText = hasNewsletterPlans
		? _x( 'Manage plans', 'unused context to distinguish translations', 'jetpack' )
		: _x( 'Add paid plan', '', 'jetpack' );

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

export default compose( [
	withSelect( select => {
		const newsletterPlans = select( 'jetpack/membership-products' )
			?.getProducts()
			?.filter( product => product.subscribe_as_site_subscriber );
		return {
			hasNewsletterPlans: newsletterPlans?.length !== 0,
		};
	} ),
] )( GetAddPaidPlanButton );
