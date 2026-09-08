import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE } from '../../../constants';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';
import { getAdminPageSlug, setPendingSidebarHighlight } from './sidebar-highlight';
import type { FeatureState } from './feature-state';

/**
 * Switching a product-backed feature on and off.
 *
 * Shared by the row's toggle and the modal's buttons so both drive the same calls and
 * report the same busy state.
 *
 * @param state - Live state for the feature.
 * @return Handlers and the flags a control needs to render itself.
 */
export function useProductSwitch( state: FeatureState ) {
	const { feature, action } = state;
	const { recordEvent } = useAnalytics();
	const { isLoading, isRefetching } = useProduct( feature.product );
	const { install, isPending: isInstalling } = useInstallPlugins( feature.product );
	const { activate, isPending: isActivating } = useActivatePlugins( feature.product );
	const { deactivate, isPending: isDeactivating } = useDeactivatePlugins( feature.product );

	const isBusy = isInstalling || isActivating || isDeactivating || isLoading || isRefetching;
	const isActive = action === 'running';

	// One place decides whether a change needs a reload, and what should survive it: a
	// success notice, and — when activating something that adds a menu item — a pointer
	// at that item, which is server-rendered and so only appears after the reload.
	const mutateOptions = useCallback(
		( active: boolean ) => {
			const sidebarSlug = active ? getAdminPageSlug( feature.manage_url ) : null;
			const needsReload =
				!! sidebarSlug || PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE.includes( feature.product );

			if ( ! needsReload ) {
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

					if ( sidebarSlug ) {
						setPendingSidebarHighlight( sidebarSlug, feature.name );
					}

					reloadPage();
				},
			};
		},
		[ feature.manage_url, feature.name, feature.product ]
	);

	const track = useCallback(
		( kind: string ) => {
			recordEvent( 'jetpack_myjetpack_features_action_click', {
				feature: feature.slug,
				action: kind,
			} );
		},
		[ feature.slug, recordEvent ]
	);

	const onInstall = useCallback( () => {
		track( 'install' );
		install( undefined, mutateOptions( true ) );
	}, [ install, mutateOptions, track ] );

	const onActivate = useCallback( () => {
		track( 'activate' );
		activate( undefined, mutateOptions( true ) );
	}, [ activate, mutateOptions, track ] );

	const onDeactivate = useCallback( () => {
		track( 'deactivate' );
		deactivate( undefined, mutateOptions( false ) );
	}, [ deactivate, mutateOptions, track ] );

	// One gesture covers install and activate, so the toggle works even when the
	// standalone plugin is still missing.
	const onToggle = useCallback( () => {
		if ( isActive ) {
			onDeactivate();
			return;
		}

		if ( action === 'install' ) {
			onInstall();
			return;
		}

		onActivate();
	}, [ action, isActive, onActivate, onDeactivate, onInstall ] );

	return { action, isActive, isBusy, onInstall, onActivate, onDeactivate, onToggle };
}
