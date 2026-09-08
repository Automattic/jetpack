import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { getModuleActivationMessage } from '../../../utils/module-benefit-messages';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';
import { getAdminPageSlug, setPendingSidebarHighlight } from './sidebar-highlight';
import type { FeatureState } from './feature-state';

// Modules that register a server-rendered wp-admin sidebar item.
const MODULES_REQUIRING_RELOAD = [ 'podcast', 'subscriptions', 'wpcom-reader' ];

/**
 * Switching a module-backed feature on and off.
 *
 * Shared by the row's toggle and the modal's buttons so both drive the same dispatch
 * and report the same busy state.
 *
 * @param state - Live state for the feature.
 * @return Handlers and the flags a control needs to render itself.
 */
export function useModuleSwitch( state: FeatureState ) {
	const { feature, module: $module } = state;
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const isBusy = useSelect(
		select => ( $module ? select( modulesStore ).isModuleUpdating( $module.module ) : false ),
		[ $module ]
	);

	const setActive = useCallback(
		async ( active: boolean ) => {
			if ( ! $module ) {
				return;
			}

			const success = await updateJetpackModuleStatus( { name: $module.module, active } );

			if ( ! success ) {
				createErrorNotice(
					active
						? sprintf(
								/* translators: %s is the feature name */
								__( 'Failed to activate %s.', 'jetpack-my-jetpack' ),
								feature.name
						  )
						: sprintf(
								/* translators: %s is the feature name */
								__( 'Failed to deactivate %s.', 'jetpack-my-jetpack' ),
								feature.name
						  )
				);
				return;
			}

			const message = active
				? getModuleActivationMessage( $module.module, feature.name )
				: sprintf(
						/* translators: %s is the feature name */
						__( '%s has been deactivated.', 'jetpack-my-jetpack' ),
						feature.name
				  );

			// Activating adds the feature's wp-admin menu item, but the sidebar is
			// rendered server-side, so it takes a reload to appear.
			const sidebarSlug = active ? getAdminPageSlug( feature.manage_url ) : null;

			if ( sidebarSlug || MODULES_REQUIRING_RELOAD.includes( $module.module ) ) {
				setPendingSuccessNotice( message );

				if ( sidebarSlug ) {
					setPendingSidebarHighlight( sidebarSlug );
				}

				reloadPage();
				return;
			}

			createSuccessNotice( message );
		},
		[
			$module,
			createErrorNotice,
			createSuccessNotice,
			feature.manage_url,
			feature.name,
			updateJetpackModuleStatus,
		]
	);

	const isActive = !! $module?.activated;
	// A module pinned on or off by a filter cannot be changed from here.
	const isLocked = ! $module || !! $module.override || ! $module.available;

	const onActivate = useCallback( () => setActive( true ), [ setActive ] );
	const onDeactivate = useCallback( () => setActive( false ), [ setActive ] );
	const onToggle = useCallback( () => setActive( ! isActive ), [ isActive, setActive ] );

	return { isActive, isBusy, isLocked, onActivate, onDeactivate, onToggle };
}
