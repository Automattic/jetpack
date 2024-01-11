import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getPaidPlanLink } from '../../memberships/utils';
import useAutosaveAndRedirect from '../../use-autosave-and-redirect';

export default function PlansSetupDialog( { showDialog, closeDialog } ) {
	const { hasTierPlans } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
		};
	} );

	const paidLink = getPaidPlanLink( hasTierPlans );
	const { autosaveAndRedirect } = useAutosaveAndRedirect( paidLink );

	return (
		<ConfirmDialog
			onRequestClose={ closeDialog }
			cancelButtonText={ __( 'Not now', 'jetpack' ) }
			confirmButtonText={ __( 'Get started', 'jetpack' ) }
			isOpen={ showDialog }
			onCancel={ closeDialog }
			onConfirm={ autosaveAndRedirect }
			style={ { maxWidth: 400 } }
		>
			<h2>{ __( 'Set up payments', 'jetpack' ) }</h2>
			<p>{ __( 'To start collecting payments, you’ll just need to:', 'jetpack' ) }</p>
			<ol>
				<li>
					{ __(
						'Create a payment offer and choose a price for access to paid content',
						'jetpack'
					) }
				</li>
				<li>{ __( 'Set up or connect your Stripe account', 'jetpack' ) }</li>
			</ol>
		</ConfirmDialog>
	);
}
