import { Button, Flex, FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN } from '../../../constants';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useProduct from '../../../data/products/use-product';
import { ProductCamelCase } from '../../../data/types';
import { useInterstitialsState } from '../../../hooks/use-interstitials-state';
import { MyJetpackModule } from '../../../types';
import { PRODUCT_STATUSES } from '../../product-card';
import { setPendingSuccessNotice } from './pending-notice';
import { useProductFiltersContext } from './products-tracking-context';
import { reloadPage } from './reload-page';

export type ProductCardActionProps = {
	product: ProductCamelCase;
	module?: MyJetpackModule;
};

/**
 * Renders the upgrade action for a product card
 *
 * @param {ProductCardActionProps} props - Component props
 *
 * @return The rendered component
 */
function UpgradeAction( { product }: ProductCardActionProps ) {
	const navigate = useNavigate();
	const { trackProductAction } = useProductFiltersContext();

	const onClick = useCallback( () => {
		trackProductAction( {
			action: 'learn_more',
			productSlug: product.slug,
			productType: 'product',
			productStatus: product.status,
			productData: product,
		} );
		navigate( `/add-${ product.slug }` );
	}, [ navigate, product, trackProductAction ] );

	return (
		<Button variant="secondary" size="compact" onClick={ onClick }>
			{ __( 'Learn more', 'jetpack-my-jetpack' ) }
		</Button>
	);
}

/**
 * Renders the (plugin) activation toggle for a product card
 *
 * @param {ProductCardActionProps} props - Component props
 *
 * @return The rendered component
 */
function ActivationToggle( {
	product,
	active = true,
	disabled = false,
	reloadOnToggle = false,
}: ProductCardActionProps & {
	active?: boolean;
	disabled?: boolean;
	reloadOnToggle?: boolean;
} ) {
	const { deactivate, isPending: isDeactivating } = useDeactivatePlugins( product.slug );
	const { activate, isPending: isActivating } = useActivatePlugins( product.slug );
	const { trackProductAction } = useProductFiltersContext();

	const { isLoading, isRefetching } = useProduct( product.slug );

	const onChange = useCallback( () => {
		const action = active ? 'deactivate' : 'activate';
		trackProductAction( {
			action,
			productSlug: product.slug,
			productType: 'product',
			productStatus: product.status,
			productData: product,
		} );
		// Some products register wp-admin menu items (e.g. Forms). Reload after the
		// toggle so server-rendered UI such as the admin sidebar reflects the change,
		// persisting the success notice so it survives the reload.
		const onReloadSuccess = () => {
			setPendingSuccessNotice(
				active
					? sprintf(
							/* translators: %s is the product name */
							__( '%s deactivated successfully!', 'jetpack-my-jetpack' ),
							product.name
					  )
					: sprintf(
							/* translators: %s is the product name */
							__( '%s activated successfully!', 'jetpack-my-jetpack' ),
							product.name
					  )
			);
			reloadPage();
		};
		const mutateOptions = reloadOnToggle ? { onSuccess: onReloadSuccess } : undefined;
		active ? deactivate( undefined, mutateOptions ) : activate( undefined, mutateOptions );
	}, [ deactivate, activate, active, product, trackProductAction, reloadOnToggle ] );

	return (
		<Flex gap={ 4 }>
			{ active ? <Badge intent="stable">{ __( 'Active', 'jetpack-my-jetpack' ) }</Badge> : null }
			<FormToggle
				disabled={ disabled || isDeactivating || isActivating || isLoading || isRefetching }
				checked={ active }
				onChange={ onChange }
				aria-label={
					active
						? sprintf(
								/* translators: %s is the product name */
								__( 'Deactivate %s', 'jetpack-my-jetpack' ),
								product.name
						  )
						: sprintf(
								/* translators: %s is the product name */
								__( 'Activate %s', 'jetpack-my-jetpack' ),
								product.name
						  )
				}
			/>
		</Flex>
	);
}

/**
 * Renders the action for a product card
 *
 * @param {ProductCardActionProps} props - Component props
 *
 * @return The rendered component
 */
export function ProductCardAction( { product, module: $module }: ProductCardActionProps ) {
	const { data: interstitials } = useInterstitialsState();

	// Forms is a free module feature with no interstitial yet — show the activation
	// toggle directly instead of a "Learn more" link. (An interstitial may be added later.)
	if ( product.slug === 'jetpack-forms' ) {
		return (
			<ActivationToggle
				product={ product }
				active={ product.status === PRODUCT_STATUSES.ACTIVE }
				disabled={ ! $module?.available }
				reloadOnToggle
			/>
		);
	}

	if ( ! product.hasPaidPlanForProduct && ! interstitials?.[ product.slug ] ) {
		return <UpgradeAction product={ product } />;
	}

	// If we already have a standalone plugin installed, we render the activation toggle
	if (
		PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN.includes( product.slug ) &&
		product.standalonePluginInfo?.isStandaloneInstalled
	) {
		return (
			<ActivationToggle
				product={ product }
				active={ product.standalonePluginInfo.isStandaloneActive }
			/>
		);
	}

	switch ( product.status ) {
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.MODULE_DISABLED:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
		case PRODUCT_STATUSES.ABSENT:
		case PRODUCT_STATUSES.NEEDS_PLAN:
			return <UpgradeAction product={ product } />;

		default:
			return <ActivationToggle product={ product } disabled={ ! $module?.available } />;
	}
}
