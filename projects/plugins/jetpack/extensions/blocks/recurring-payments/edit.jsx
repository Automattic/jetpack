/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ProductManagementControls from '../../shared/components/product-management-controls';

export default function Edit( props ) {
	const { setAttributes, attributes } = props;
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

	return (
		<>
			<ProductManagementControls
				allowCreateOneTimeInterval={ true }
				selectedProductId={ planId }
				setSelectedProductId={ updateSubscriptionPlan }
			/>
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
