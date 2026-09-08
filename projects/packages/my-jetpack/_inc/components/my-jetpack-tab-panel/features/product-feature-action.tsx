import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback } from 'react';
import { PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE } from '../../../constants';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';
import type { FeatureState } from './feature-state';

type ProductFeatureActionProps = {
	state: FeatureState;
};

/**
 * The action control for a feature backed by a My Jetpack product.
 *
 * State comes from the products store rather than the feature catalog, so the row
 * reflects an install or activation as soon as it lands.
 *
 * @param {ProductFeatureActionProps} props       - The component props.
 * @param {FeatureState}              props.state - Live state for the feature.
 * @return The rendered component.
 */
export function ProductFeatureAction( { state }: ProductFeatureActionProps ) {
	const { feature, action, product: detail } = state;
	const { recordEvent } = useAnalytics();
	const { isLoading, isRefetching } = useProduct( feature.product );
	const { install, isPending: isInstalling } = useInstallPlugins( feature.product );
	const { activate, isPending: isActivating } = useActivatePlugins( feature.product );
	const { deactivate, isPending: isDeactivating } = useDeactivatePlugins( feature.product );

	const isBusy = isInstalling || isActivating || isDeactivating || isLoading || isRefetching;
	const reloadOnToggle = PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE.includes( feature.product );

	// Menu-registering products need a full reload for the admin sidebar to catch up,
	// so their success notice is persisted across it.
	const withReload = useCallback(
		( active: boolean ) => {
			if ( ! reloadOnToggle ) {
				return undefined;
			}

			return {
				onSuccess: () => {
					setPendingSuccessNotice(
						active
							? sprintf(
									/* translators: %s is the feature name */
									__( '%s activated successfully!', 'jetpack-my-jetpack' ),
									feature.name
							  )
							: sprintf(
									/* translators: %s is the feature name */
									__( '%s deactivated successfully!', 'jetpack-my-jetpack' ),
									feature.name
							  )
					);
					reloadPage();
				},
			};
		},
		[ feature.name, reloadOnToggle ]
	);

	const track = useCallback(
		( kind: string ) => {
			recordEvent( 'jetpack_myjetpack_features_action_click', {
				feature: feature.slug,
				action: kind,
				status: detail?.status,
			} );
		},
		[ detail?.status, feature.slug, recordEvent ]
	);

	const onInstall = useCallback( () => {
		track( 'install' );
		install( undefined, withReload( true ) );
	}, [ install, track, withReload ] );

	const onActivate = useCallback( () => {
		track( 'activate' );
		activate( undefined, withReload( true ) );
	}, [ activate, track, withReload ] );

	const onToggle = useCallback( () => {
		track( 'deactivate' );
		deactivate( undefined, withReload( false ) );
	}, [ deactivate, track, withReload ] );

	if ( ! detail ) {
		return null;
	}

	if ( action === 'install' ) {
		return (
			<Button variant="solid" onClick={ onInstall } disabled={ isBusy } loading={ isBusy }>
				{ __( 'Install', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	if ( action === 'activate' ) {
		return (
			<Button variant="solid" onClick={ onActivate } disabled={ isBusy } loading={ isBusy }>
				{ __( 'Activate', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	if ( action !== 'running' ) {
		return null;
	}

	return (
		<Button
			variant="outline"
			tone="neutral"
			onClick={ onToggle }
			disabled={ isBusy }
			loading={ isBusy }
			aria-label={ sprintf(
				/* translators: %s is the feature name */
				__( 'Deactivate %s', 'jetpack-my-jetpack' ),
				feature.name
			) }
		>
			{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
		</Button>
	);
}
