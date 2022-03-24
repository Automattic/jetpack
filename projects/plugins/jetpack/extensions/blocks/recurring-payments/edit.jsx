/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
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

export default function Edit( { attributes, clientId, setAttributes } ) {
	const { planId } = attributes;
	const postLink = useSelect(
		select => new URL( select( editorStore ).getCurrentPost().link ),
		[]
	);
	const upgradeUrl = useSelect( select => select( membershipProductsStore ).getUpgradeUrl() );

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

	const availability = getJetpackExtensionAvailability( 'recurring-payments' );
	const showJetpackUpgradeNudge =
		!! upgradeUrl && 'missing_plan' !== availability?.unavailableReason;

	return (
		<div className="wp-block-jetpack-recurring-payments">
			{ showControls && (
				<ProductManagementControls
					allowCreateOneTimeInterval={ true }
					blockName="recurring-payments"
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
