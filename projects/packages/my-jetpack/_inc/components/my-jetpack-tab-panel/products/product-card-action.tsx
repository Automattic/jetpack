import { Badge } from '@automattic/ui';
import { Button, Flex, FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useProduct from '../../../data/products/use-product';
import { ProductCamelCase } from '../../../data/types';
import { PRODUCT_STATUSES } from '../../product-card';

export type ProductCardActionProps = {
	product: ProductCamelCase;
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

	const onClick = useCallback( () => {
		navigate( `/add-${ product.slug }` );
	}, [ navigate, product.slug ] );

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
}: ProductCardActionProps & { active?: boolean; disabled?: boolean } ) {
	const { deactivate, isPending: isDeactivating } = useDeactivatePlugins( product.slug );
	const { activate, isPending: isActivating } = useActivatePlugins( product.slug );

	const { isLoading, isRefetching } = useProduct( product.slug );

	const onChange = useCallback( () => {
		active ? deactivate() : activate();
	}, [ deactivate, activate, active ] );

	return (
		<Flex gap={ 4 }>
			{ active ? <Badge intent="success">{ __( 'Active', 'jetpack-my-jetpack' ) }</Badge> : null }
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

const noop = () => {};

/**
 * Renders a disabled toggle for a product card when the standalone plugin is missing
 *
 * @param {ProductCardActionProps} props - Component props
 *
 * @return The rendered component
 */
function DisabledToggleWithPluginMissing( { product }: ProductCardActionProps ) {
	return (
		<Flex gap={ 4 }>
			<Badge intent="error">{ __( 'Missing plugin', 'jetpack-my-jetpack' ) }</Badge>
			<FormToggle
				disabled
				checked={ false }
				onChange={ noop }
				aria-label={ sprintf(
					/* translators: %s is the product name */
					__( 'Activate %s', 'jetpack-my-jetpack' ),
					product.name
				) }
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
export function ProductCardAction( { product }: ProductCardActionProps ) {
	// If we already have a standalone plugin installed, we render the activation toggle
	if ( product.standalonePluginInfo?.isStandaloneInstalled ) {
		// Backup standalone plugin cannot be activated via the API call at the time of writing.
		if ( product.slug === 'backup' && ! product.standalonePluginInfo.isStandaloneActive ) {
			return <DisabledToggleWithPluginMissing product={ product } />;
		}

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
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return <UpgradeAction product={ product } />;

		default:
			// We assume that the product is active but can't be deactivated
			// For example AI Assistant.
			return <ActivationToggle product={ product } disabled />;
	}
}
