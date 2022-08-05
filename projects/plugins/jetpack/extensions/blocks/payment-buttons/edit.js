import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import StripeConnectToolbarButton from '../../shared/components/stripe-connect-toolbar-button';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { store as membershipProductsStore } from '../../store/membership-products';
import { icon, title } from '.';

const ALLOWED_BLOCKS = [ 'jetpack/recurring-payments' ];

function PaymentButtonsEdit( { clientId } ) {
	const { connectUrl, isApiConnected, shouldUpgrade, upgradeUrl } = useSelect( select => {
		const { getConnectUrl, getShouldUpgrade, getUpgradeUrl, isApiStateConnected } = select(
			membershipProductsStore
		);
		return {
			connectUrl: getConnectUrl(),
			isApiConnected: isApiStateConnected(),
			shouldUpgrade: getShouldUpgrade(),
			upgradeUrl: getUpgradeUrl(),
		};
	} );

	const paymentButtonBlocks = useSelect(
		select =>
			select( 'core/block-editor' )
				.getBlock( clientId )
				.innerBlocks.filter( block => block.name === 'jetpack/recurring-payments' ),
		[ clientId ]
	);

	// Hides the Stripe/plan upgrade nudges from the inner blocks since this block already displays them.
	addFilter(
		'jetpack.recurringPayments.editorSettings',
		'jetpack/payment-buttons-hide-nudges-from-inner-blocks',
		( editorSettings, paymentButtonClientId ) => {
			if (
				paymentButtonBlocks.some(
					paymentButtonBlock => paymentButtonBlock.clientId === paymentButtonClientId
				)
			) {
				return {
					...editorSettings,
					showStripeNudge: false,
					showUpgradeNudge: false,
				};
			}
			return editorSettings;
		}
	);

	const availability = getJetpackExtensionAvailability( 'recurring-payments' );
	const hasWpcomUpgradeNudge =
		! availability.available && 'missing_plan' === availability.unavailableReason;
	const showJetpackUpgradeNudge = !! upgradeUrl && ! hasWpcomUpgradeNudge;
	const showStripeConnectAction = ! shouldUpgrade && ! isApiConnected && !! connectUrl;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			orientation: 'horizontal',
			template: [ [ 'jetpack/recurring-payments' ] ],
			templateInsertUpdatesSelection: true,
		}
	);

	return (
		<div { ...blockProps }>
			{ showStripeConnectAction && (
				<BlockControls group="block">
					<StripeConnectToolbarButton
						blockName="jetpack/payment-buttons"
						connectUrl={ connectUrl }
					/>
				</BlockControls>
			) }
			{ showJetpackUpgradeNudge && (
				<Placeholder
					icon={ icon }
					instructions={ __(
						"You'll need to upgrade your plan to use the Payment Buttons block.",
						'jetpack'
					) }
					label={ title }
				>
					<Button href={ upgradeUrl } target="_blank" variant="secondary">
						{ __( 'Upgrade your plan', 'jetpack' ) }
					</Button>
					<div className="membership-button__disclaimer">
						<ExternalLink href="https://wordpress.com/support/wordpress-editor/blocks/payments/#related-fees">
							{ __( 'Read more about Payments and related fees.', 'jetpack' ) }
						</ExternalLink>
					</div>
				</Placeholder>
			) }
			{ showStripeConnectAction && <StripeNudge blockName="payment-buttons" /> }
			<div { ...innerBlocksProps } />
		</div>
	);
}

export default PaymentButtonsEdit;
