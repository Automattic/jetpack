/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { icon, title } from './';
import ProductManagementControls from '../../shared/components/product-management-controls';
import { store as membershipProductsStore } from '../../store/membership-products';
import { getEditorType, POST_EDITOR } from '../../shared/get-editor-type';
import { useEffect } from '@wordpress/element';
import { useCallback } from 'react';

export default function Edit( { attributes, clientId, context, setAttributes } ) {
	const { planId } = attributes;
	const { isPremiumContentChild } = context;
	const editorType = getEditorType();
	const postLink = useSelect( select => select( editorStore )?.getCurrentPost()?.link, [] );
	const upgradeUrl = useSelect( select => select( membershipProductsStore ).getUpgradeUrl() );

	const updateSubscriptionPlan = useCallback(
		newPlanId => {
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
			} );
		},
		[ editorType, postLink, setAttributes ]
	);

	useEffect( () => {
		updateSubscriptionPlan( planId );
	}, [ planId, updateSubscriptionPlan ] );

	/**
	 * Filters the flag that determines if the Recurring Payments block controls should be shown in the inspector.
	 * We supply true as the first argument since we should always show the controls by default.
	 *
	 * @param {boolean} showControls - Whether inspectors controls are shown.
	 * @param {string} showControls - Block ID.
	 */
	const showControls = applyFilters( 'jetpack.RecurringPayments.showControls', true, clientId );

	const availability = getJetpackExtensionAvailability( 'recurring-payments' );
	const hasWpcomUpgradeNudge =
		! availability.available && 'missing_plan' === availability.unavailableReason;
	const showJetpackUpgradeNudge =
		!! upgradeUrl && ! hasWpcomUpgradeNudge && ! isPremiumContentChild;

	return (
		<div className="wp-block-jetpack-recurring-payments">
			{ showControls && (
				<ProductManagementControls
					blockName="recurring-payments"
					clientId={ clientId }
					selectedProductId={ planId }
					setSelectedProductId={ updateSubscriptionPlan }
				/>
			) }

			{ showJetpackUpgradeNudge && (
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

			<InnerBlocks
				template={ [
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
				] }
				templateLock="all"
				__experimentalCaptureToolbars={ true }
				templateInsertUpdatesSelection={ false }
			/>
		</div>
	);
}
