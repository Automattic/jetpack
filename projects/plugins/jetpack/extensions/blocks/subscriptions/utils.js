import { Button, ToolBarButton } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

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

export const getPaidPlanLink = () => {
	const siteSlug = location.hostname;
	return 'https://wordpress.com/earn/payments-plans/' + siteSlug + '#add-new-payment-plan';
};

function GetAddPaidPlanButton( { context, hasNewsletterPlans } ) {
	const addPaidPlanButtonText = hasNewsletterPlans
		? __( 'Manage plans', 'jetpack' )
		: __( 'Add paid plan', 'jetpack' );
	if ( 'toolbar' === context ) {
		return (
			<ToolBarButton href={ getPaidPlanLink() } target="_blank">
				{ addPaidPlanButtonText }
			</ToolBarButton>
		);
	}
	return (
		<Button variant="primary" href={ getPaidPlanLink() } target="_blank">
			{ addPaidPlanButtonText }
		</Button>
	);
}

export default compose( [
	withSelect( select => {
		const newsletterPlans = select( 'jetpack/membership-products' )
			.getProducts()
			.filter( product => product.subscribe_as_site_subscriber );
		return {
			hasNewsletterPlans: newsletterPlans.length !== 0,
		};
	} ),
] )( GetAddPaidPlanButton );
