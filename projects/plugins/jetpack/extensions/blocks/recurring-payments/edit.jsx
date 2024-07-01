import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import ProductManagementControls from '../../shared/components/product-management-controls';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { getEditorType, POST_EDITOR } from '../../shared/get-editor-type';
import useWidth from '../../shared/use-width';
import { WidthPanel } from '../../shared/width-panel';
import { getBlockStyles } from './util';

// If we use the name on index.js and the block name changes the events block name will also change.
const BLOCK_NAME = 'recurring-payments';

export default function Edit( { attributes, clientId, setAttributes } ) {
	const { align, planId, planIds, width } = attributes;

	// planId is a integer, planIds is an array.
	// if planIds is set, use it, otherwise use planId. Going forward we should only use planIds.
	// This is placed in useMemo to support the useCallback and useEffect hooks below.
	const _planIds = useMemo( () => {
		return planIds || ( planId ? [ planId ] : [] );
	}, [ planId, planIds ] );

	const editorType = getEditorType();
	const postLink = useSelect( select => select( editorStore )?.getCurrentPost()?.link, [] );

	const updateSubscriptionPlans = useCallback(
		newPlanIds => {
			// verify newPlanIds is a non-empty array.
			if ( ! Array.isArray( newPlanIds ) || 0 === newPlanIds.length ) {
				return;
			}
			// ensure/convert all elements to integers.
			const validatedPlanIds = newPlanIds
				.map( id => parseInt( id, 10 ) )
				.filter( id => ! isNaN( id ) );

			// if all the elements match the existing planIds, do nothing.
			if (
				Array.isArray( _planIds ) &&
				validatedPlanIds.length === _planIds.length &&
				validatedPlanIds.every( i => _planIds.includes( i ) )
			) {
				return;
			}

			const newPlanId = validatedPlanIds.join( '+' );
			const resolvePaymentUrl = paymentPlanId => {
				if ( POST_EDITOR !== editorType || ! postLink ) {
					return '#';
				}

				const postUrl = new URL( postLink );
				postUrl.searchParams.set( 'recurring_payments', paymentPlanId );
				return postUrl.toString();
			};

			setAttributes( {
				planId: null,
				planIds: validatedPlanIds,
				url: resolvePaymentUrl( newPlanId ),
				uniqueId: `recurring-payments-${ newPlanId }`,
			} );
		},
		[ editorType, _planIds, postLink, setAttributes ]
	);

	useEffect( () => {
		updateSubscriptionPlans( _planIds );
	}, [ _planIds, updateSubscriptionPlans ] );

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
					selectedProductIds={ _planIds }
					setSelectedProductIds={ updateSubscriptionPlans }
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
