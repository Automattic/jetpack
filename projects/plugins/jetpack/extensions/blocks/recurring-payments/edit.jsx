/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InnerBlocks } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import ProductManagementControls from '../../shared/components/product-management-controls';

export default function Edit( props ) {
	const { setAttributes, attributes, clientId } = props;
	const { planId } = attributes;
	const postLink = useSelect(
		select => new URL( select( 'core/editor' ).getCurrentPost().link ),
		[]
	);

	const updateSubscriptionPlan = newPlanId => {
		postLink.searchParams.set( 'recurring_payments', newPlanId );
		return setAttributes( {
			planId: newPlanId,
			// We need to use an absolute URL otherwise the reader won't be able to open the post.
			url: postLink.toString(),
			uniqueId: `recurring-payments-${ newPlanId }`,
		} );
	};

	/**
	 * Filters the flag that determines if the Recurring Payments block controls should be shown in the inspector.
	 * We supply true as the first argument since we should always show the controls by default.
	 *
	 * @param {boolean} showControls - Whether inspectors controls are shown.
	 * @param {string} showControls - Block ID.
	 */
	const showControls = applyFilters( 'jetpack.RecurringPayments.showControls', true, clientId );

	return (
		<>
			{ showControls && (
				<ProductManagementControls
					allowCreateOneTimeInterval={ true }
					blockName="recurring-payments"
					selectedProductId={ planId }
					setSelectedProductId={ updateSubscriptionPlan }
				/>
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
		</>
	);
}
