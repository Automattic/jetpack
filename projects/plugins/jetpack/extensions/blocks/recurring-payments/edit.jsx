import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import ProductManagementControls from '../../shared/components/product-management-controls';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { getEditorType, POST_EDITOR } from '../../shared/get-editor-type';
import useWidth from '../../shared/use-width';
import { WidthPanel } from '../../shared/width-panel';
import { store as membershipProductsStore } from '../../store/membership-products';
import { getBlockStyles } from './util';
import { icon, title } from './';

// If we use the name on index.js and the block name changes the events block name will also change.
const BLOCK_NAME = 'recurring-payments';

export default function Edit( { attributes, clientId, context, setAttributes } ) {
	const { align, planId, width, buyerCanChangeAmount } = attributes;
	const { isPremiumContentChild } = context;
	const editorType = getEditorType();
	const postLink = useSelect( select => select( editorStore )?.getCurrentPost()?.link, [] );
	const upgradeUrl = useSelect( select => select( membershipProductsStore ).getUpgradeUrl() );

	const updateSubscriptionPlan = useCallback(
		( newPlanId, product ) => {
			const resolvePaymentUrl = paymentPlanId => {
				if ( POST_EDITOR !== editorType || ! postLink ) {
					return '#';
				}

				const postUrl = new URL( postLink );
				postUrl.searchParams.set( 'recurring_payments', paymentPlanId );
				return postUrl.toString();
			};

			setAttributes( {
				planId: newPlanId,
				url: resolvePaymentUrl( newPlanId ),
				uniqueId: `recurring-payments-${ newPlanId }`,
				buyerCanChangeAmount: product?.buyer_can_change_amount || false,
			} );
		},
		[ editorType, postLink, setAttributes ]
	);

	useEffect( () => {
		updateSubscriptionPlan( planId, { buyer_can_change_amount: buyerCanChangeAmount || false } );
	}, [ buyerCanChangeAmount, planId, updateSubscriptionPlan ] );

	const availability = getJetpackExtensionAvailability( 'recurring-payments' );
	const hasWpcomUpgradeNudge =
		! availability.available && 'missing_plan' === availability.unavailableReason;
	const showJetpackUpgradeNudge =
		!! upgradeUrl && ! hasWpcomUpgradeNudge && ! isPremiumContentChild;

	/**
	 * Filters the editor settings of the Payment Button block (`jetpack/recurring-payments`).
	 *
	 * @param {object} editorSettings - An object with the block settings.
	 * @param {boolean} editorSettings.showProductManagementControls - Whether the product management block controls should be shown.
	 * @param {boolean} editorSettings.showStripeNudge - Whether the action to connect to Stripe should be shown.
	 * @param {boolean} editorSettings.showUpgradeNudge - Whether the plan upgrade nudge should be shown.
	 * @param {string} clientId - Block ID.
	 */
	const { showProductManagementControls, showStripeNudge, showUpgradeNudge } = applyFilters(
		'jetpack.recurringPayments.editorSettings',
		{
			showProductManagementControls: true,
			showStripeNudge: true,
			showUpgradeNudge: showJetpackUpgradeNudge,
		},
		clientId
	);

	useWidth( { attributes, setAttributes } );

	const blockProps = useBlockProps( { style: getBlockStyles( { width } ) } );
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: [
				[
					'jetpack/button',
					{
						element: 'a',
						passthroughAttributes: {
							uniqueId: 'uniqueId',
							url: 'url',
						},
					},
				],
			],
			templateLock: 'all',
			templateInsertUpdatesSelection: true,
		}
	);

	return (
		<div { ...blockProps }>
			{ showProductManagementControls && (
				<ProductManagementControls
					blockName={ BLOCK_NAME }
					clientId={ clientId }
					selectedProductId={ planId }
					setSelectedProductId={ updateSubscriptionPlan }
				/>
			) }
			<InspectorControls>
				<WidthPanel
					align={ align }
					width={ width }
					onChange={ newWidth => setAttributes( { width: newWidth } ) }
				/>
			</InspectorControls>
			{ showUpgradeNudge && (
				<Placeholder
					icon={ icon }
					instructions={ __(
						"You'll need to upgrade your plan to use the Payments block.",
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
			{ showStripeNudge && <StripeNudge blockName={ BLOCK_NAME } /> }
			<div { ...innerBlocksProps } />
		</div>
	);
}
