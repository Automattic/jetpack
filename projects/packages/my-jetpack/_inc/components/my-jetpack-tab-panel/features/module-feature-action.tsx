import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback } from 'react';
import { getModuleActivationMessage } from '../../../utils/module-benefit-messages';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';
import type { FeatureState } from './feature-state';

// Modules that register a server-rendered wp-admin sidebar item need a full reload
// for the sidebar to reflect the change.
const MODULES_REQUIRING_RELOAD = [ 'podcast', 'subscriptions', 'wpcom-reader' ];

type ModuleFeatureActionProps = {
	state: FeatureState;
};

/**
 * Activate and deactivate buttons for a feature governed by a Jetpack module.
 *
 * Buttons rather than a toggle, so a module reads the same as a product does.
 *
 * @param {ModuleFeatureActionProps} props       - The component props.
 * @param {FeatureState}             props.state - Live state for the feature.
 * @return The rendered component.
 */
export function ModuleFeatureAction( { state }: ModuleFeatureActionProps ) {
	const { feature, module: $module } = state;
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const isUpdating = useSelect(
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

			if ( MODULES_REQUIRING_RELOAD.includes( $module.module ) ) {
				setPendingSuccessNotice( message );
				reloadPage();
				return;
			}

			createSuccessNotice( message );
		},
		[ $module, createErrorNotice, createSuccessNotice, feature.name, updateJetpackModuleStatus ]
	);

	const onActivate = useCallback( () => setActive( true ), [ setActive ] );
	const onDeactivate = useCallback( () => setActive( false ), [ setActive ] );

	if ( ! $module ) {
		return null;
	}

	// A module pinned on or off by a filter cannot be changed from here.
	const isLocked = !! $module.override || ! $module.available;

	if ( $module.activated ) {
		return (
			<Button
				variant="outline"
				tone="neutral"
				onClick={ onDeactivate }
				disabled={ isUpdating || isLocked }
				loading={ isUpdating }
			>
				{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	return (
		<Button
			variant="solid"
			onClick={ onActivate }
			disabled={ isUpdating || isLocked }
			loading={ isUpdating }
		>
			{ __( 'Activate', 'jetpack-my-jetpack' ) }
		</Button>
	);
}
