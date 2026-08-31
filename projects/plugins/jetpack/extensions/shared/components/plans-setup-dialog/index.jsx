import { useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import {
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getPaidPlanLink } from '../../memberships/utils';

export default function PlansSetupDialog( { showDialog, closeDialog } ) {
	const { hasTierPlans, stripeConnectUrl } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
		};
	} );

	const paidLink = getPaidPlanLink( hasTierPlans );
	const { autosaveAndRedirect } = useAutosaveAndRedirect( paidLink );

	const needsStripe = !! stripeConnectUrl;
	const needsTier = ! hasTierPlans;

	let title;
	let body;
	if ( needsStripe && needsTier ) {
		title = __( 'Set up payments', 'jetpack' );
		body = (
			<>
				<p>{ __( 'To start collecting payments, you’ll just need to:', 'jetpack' ) }</p>
				<ol>
					<li>
						{ __(
							'Create a newsletter tier and choose a price for access to paid content',
							'jetpack'
						) }
					</li>
					<li>{ __( 'Set up or connect your Stripe account', 'jetpack' ) }</li>
				</ol>
			</>
		);
	} else if ( needsTier ) {
		title = __( 'Add a newsletter tier', 'jetpack' );
		body = (
			<p>
				{ __(
					'To offer paid subscriptions, create a newsletter tier and choose a price for access to paid content.',
					'jetpack'
				) }
			</p>
		);
	} else {
		title = __( 'Connect Stripe', 'jetpack' );
		body = (
			<p>
				{ __( 'To start collecting payments, set up or connect your Stripe account.', 'jetpack' ) }
			</p>
		);
	}

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
			<h2>{ title }</h2>
			{ body }
		</ConfirmDialog>
	);
}
