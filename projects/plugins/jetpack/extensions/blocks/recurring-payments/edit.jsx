import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { useCallback } from 'react';
import ProductManagementControls from '../../shared/components/product-management-controls';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { getEditorType, POST_EDITOR } from '../../shared/get-editor-type';
import useWidth from '../../shared/use-width';
import { WidthPanel } from '../../shared/width-panel';
import { getBlockStyles } from './util';

// If we use the name on index.js and the block name changes the events block name will also change.
const BLOCK_NAME = 'recurring-payments';

export default function Edit( { attributes, clientId, setAttributes } ) {
	const { align, planId, width } = attributes;
	const editorType = getEditorType();
	const postLink = useSelect( select => select( editorStore )?.getCurrentPost()?.link, [] );

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
	 * Filters the editor settings of the Payment Button block (`jetpack/recurring-payments`).
	 *
	 * @param {object} editorSettings - An object with the block settings.
	 * @param {boolean} editorSettings.showProductManagementControls - Whether the product management block controls should be shown.
	 * @param {boolean} editorSettings.showStripeNudge - Whether the action to connect to Stripe should be shown.
	 * @param {string} clientId - Block ID.
	 */
	const { showProductManagementControls, showStripeNudge } = applyFilters(
		'jetpack.recurringPayments.editorSettings',
		{
			showProductManagementControls: true,
			showStripeNudge: true,
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
			{ showStripeNudge && <StripeNudge blockName={ BLOCK_NAME } /> }
			<div { ...innerBlocksProps } />
		</div>
	);
}
