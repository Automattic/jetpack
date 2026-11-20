import { useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { AlertDialog } from '@wordpress/ui';
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
	let description;
	let steps;
	if ( needsStripe && needsTier ) {
		title = __( 'Set up payments', 'jetpack' );
		description = __( 'To start collecting payments, you’ll just need to:', 'jetpack' );
		steps = (
			<ol>
				<li>
					{ __(
						'Create a newsletter tier and choose a price for access to paid content',
						'jetpack'
					) }
				</li>
				<li>{ __( 'Set up or connect your Stripe account', 'jetpack' ) }</li>
			</ol>
		);
	} else if ( needsTier ) {
		title = __( 'Add a newsletter tier', 'jetpack' );
		description = __(
			'To offer paid subscriptions, create a newsletter tier and choose a price for access to paid content.',
			'jetpack'
		);
	} else {
		title = __( 'Connect Stripe', 'jetpack' );
		description = __(
			'To start collecting payments, set up or connect your Stripe account.',
			'jetpack'
		);
	}

	return (
		<AlertDialog.Root
			open={ showDialog }
			onOpenChange={ open => ! open && closeDialog() }
			onConfirm={ autosaveAndRedirect }
		>
			<AlertDialog.Popup
				title={ title }
				description={ description }
				cancelButtonText={ __( 'Not now', 'jetpack' ) }
				confirmButtonText={ __( 'Get started', 'jetpack' ) }
			>
				{ steps }
			</AlertDialog.Popup>
		</AlertDialog.Root>
	);
}
