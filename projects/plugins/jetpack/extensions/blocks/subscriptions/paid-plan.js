import { PanelBody, PanelRow } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import GetAddPaidPlanButton from './utils';

function PaidPlanPanel( { hasNewsletterPlans } ) {
	const title = __( 'Paid Newsletter', 'jetpack' );
	const text = hasNewsletterPlans
		? _x(
				'Manage paid plan for readers to access your content.',
				'unused context to distinguish translations',
				'jetpack'
		  )
		: _x( 'Set up paid plan for readers to access your content.', '', 'jetpack' );

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
