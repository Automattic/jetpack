import { BlockControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import StripeConnectToolbarButton from '../../shared/components/stripe-connect-toolbar-button';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { store as membershipProductsStore } from '../../store/membership-products';

const ALLOWED_BLOCKS = [ 'jetpack/recurring-payments' ];

function PaymentButtonsEdit( { clientId, attributes } ) {
	const { layout, fontSize } = attributes;
	const { connectUrl, isApiConnected } = useSelect( select => {
		const { getConnectUrl, isApiStateConnected } = select( membershipProductsStore );
		return {
			connectUrl: getConnectUrl(),
			isApiConnected: isApiStateConnected(),
		};
	} );

	const paymentButtonBlocks = useSelect(
		select =>
			select( 'core/block-editor' )
				.getBlock( clientId )
				.innerBlocks.filter( block => block.name === 'jetpack/recurring-payments' ),
		[ clientId ]
	);

	useEffect( () => {
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
						/*
						 * This block already displays Stripe and plan upgrades nudges, so we hide the ones
						 * displayed in the inner blocks.
						 */
						showStripeNudge: false,
						showUpgradeNudge: false,
					};
				}
				return editorSettings;
			}
		);
	}, [ paymentButtonBlocks ] );

	const showStripeConnectAction = ! isApiConnected && !! connectUrl;

	const blockProps = useBlockProps( {
		className: clsx( {
			'has-custom-font-size': !! fontSize || attributes?.style?.typography?.fontSize,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		template: [ [ 'jetpack/recurring-payments' ] ],
		templateInsertUpdatesSelection: true,
		layout,
	} );

	// The ID needs to be just on the outermost wrapper - the toolbar and wpcom upgrade nudge
	// will then be positioned in relation to this.
	delete innerBlocksProps.id;
	delete innerBlocksProps[ 'data-block' ];
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
			{ showStripeConnectAction && <StripeNudge blockName="payment-buttons" /> }
			<div { ...innerBlocksProps } />
		</div>
	);
}

export default PaymentButtonsEdit;
