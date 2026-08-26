import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import styles from './styles.module.scss';
import type { AdminMenuItem } from './types';
import type { ProductCamelCase } from '../../../data/types';
import type { MyJetpackModule } from '../../../types';

type InactiveProductRowProps = {
	canManage: boolean;
	item: AdminMenuItem;
	module?: MyJetpackModule;
	product?: ProductCamelCase;
	onActivated: ( item: AdminMenuItem ) => void;
	onActivationError: ( item: AdminMenuItem ) => void;
};

const DIRECT_ACTIVATION_STATUSES: ProductStatus[] = [
	'inactive',
	'module_disabled',
	'needs_activation',
];

/**
 * A non-sortable product discovery row for a feature not currently in the Jetpack menu.
 *
 * @param props - Inactive product data and callbacks.
 * @return Product row with its contextual action.
 */
export function InactiveProductRow( props: InactiveProductRowProps ) {
	const { canManage, item, module, onActivated, onActivationError, product } = props;
	const navigate = useNavigate();
	const { activate, isPending } = useActivatePlugins( item.productSlug ?? '' );
	const moduleCanActivate = module?.available === true;
	const installedStandaloneCanActivate =
		product?.standalonePluginInfo?.isStandaloneInstalled === true &&
		product.standalonePluginInfo.isStandaloneActive !== true;
	const statusCanActivate =
		product?.status !== undefined && DIRECT_ACTIVATION_STATUSES.includes( product.status );
	const canActivate = moduleCanActivate || installedStandaloneCanActivate || statusCanActivate;

	const activateProduct = useCallback( () => {
		activate( undefined, {
			onSuccess: () => onActivated( item ),
			onError: () => onActivationError( item ),
		} );
	}, [ activate, item, onActivated, onActivationError ] );

	const learnMore = useCallback( () => {
		navigate( `/add-${ item.productSlug }` );
	}, [ item.productSlug, navigate ] );

	let action = (
		<Text variant="body-sm" className={ styles[ 'inactive-guidance' ] }>
			{ __( 'Ask an administrator to activate', 'jetpack-my-jetpack' ) }
		</Text>
	);
	if ( canManage && canActivate ) {
		action = (
			<Button
				variant="outline"
				tone="neutral"
				loading={ isPending }
				loadingAnnouncement={ sprintf(
					/* translators: %s is a product name. */
					__( 'Activating %s', 'jetpack-my-jetpack' ),
					item.label
				) }
				onClick={ activateProduct }
				aria-label={ sprintf(
					/* translators: %s is a product name. */
					__( 'Activate %s', 'jetpack-my-jetpack' ),
					item.label
				) }
			>
				{ __( 'Activate', 'jetpack-my-jetpack' ) }
			</Button>
		);
	} else if ( canManage ) {
		action = (
			<Button
				variant="outline"
				tone="neutral"
				onClick={ learnMore }
				aria-label={ sprintf(
					/* translators: %s is a product name. */
					__( 'Learn more about %s', 'jetpack-my-jetpack' ),
					item.label
				) }
			>
				{ __( 'Learn more', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	return (
		<div className={ styles[ 'inactive-row' ] } role="listitem">
			<div className={ styles[ 'row-copy' ] }>
				<Text variant="body-md" className={ styles[ 'row-title' ] }>
					{ item.label }
				</Text>
				<Text variant="body-sm" className={ styles[ 'row-description' ] }>
					{ __( 'Not currently shown in your Jetpack menu', 'jetpack-my-jetpack' ) }
				</Text>
			</div>
			<div className={ styles[ 'inactive-status' ] }>
				<Badge intent="medium">{ __( 'Inactive', 'jetpack-my-jetpack' ) }</Badge>
				{ action }
			</div>
		</div>
	);
}
