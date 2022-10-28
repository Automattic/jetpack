import { PanelBody, PanelRow } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import GetAddPaidPlanButton from './utils';

function PaidPlanPanel( { hasNewsletterPlans } ) {
	const title = __( 'Paid Newsletter', 'jetpack' );
	let text;
	if ( hasNewsletterPlans ) {
		// I am rewriting this from ternary operator since webpack optimization seems to change it from ( x ? __( 'a' ) : __( 'b' ) ) to ( __( x ? 'a' : 'b' ) ).
		text = __( 'Manage paid plan for readers to access your content.', 'jetpack' );
	} else {
		text = __( 'Set up paid plan for readers to access your content.', 'jetpack' );
	}

	return (
		<PanelBody title={ title } initialOpen={ true }>
			<PanelRow>{ text }</PanelRow>
			<PanelRow>
				<GetAddPaidPlanButton hasNewsletterPlans={ hasNewsletterPlans } />
			</PanelRow>
		</PanelBody>
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
] )( PaidPlanPanel );
