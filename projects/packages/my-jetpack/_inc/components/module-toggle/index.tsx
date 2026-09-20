import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { FormToggle } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { queueActivationRequest } from '../../data/queue-activation-request';
import { MyJetpackModule } from '../../types';
import { getBlockThemeMigration } from '../../utils/block-theme-migration';
import { getModuleActivationMessage } from '../../utils/module-benefit-messages';
import SecondaryButton from '../action-button/secondary-button';
import { setPendingSuccessNotice } from '../my-jetpack-tab-panel/products/pending-notice';
import { useProductFiltersContext } from '../my-jetpack-tab-panel/products/products-tracking-context';
import { reloadPage } from '../my-jetpack-tab-panel/products/reload-page';
import type { ChangeEvent } from 'react';

export type ModuleToggleProps = {
	module: MyJetpackModule;
	describedby?: string;
	/** False keeps the page in place, leaving the sidebar to catch up on the next load. */
	reloadAfterToggle?: boolean;
};

// Modules that register a server-rendered wp-admin sidebar item. Toggling them
// needs a full page reload for the sidebar to reflect the change; the success
// notice is persisted so it survives the reload.
const MODULES_REQUIRING_RELOAD = [ 'activity-log', 'podcast', 'subscriptions', 'wpcom-reader' ];

/**
 * Switch a Jetpack module on or off, however the surface chooses to present that.
 *
 * Shared with the Features modal, which offers buttons rather than a switch: both must
 * run the same mutation, notices and post-activation reload.
 *
 * @param $module        - The module to switch.
 * @param options        - Hook options.
 * @param options.reload - False skips the sidebar reload, for surfaces where several
 *                       switches are flipped in a row.
 * @return The handler and whether a mutation is in flight.
 */
export function useModuleActivation(
	$module: MyJetpackModule,
	{ reload = true }: { reload?: boolean } = {}
) {
	const { updateJetpackModuleStatus: toggleModule } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const { trackProductAction } = useProductFiltersContext() || {};

	const storeIsUpdating = useSelect(
		select => select( modulesStore ).isModuleUpdating( $module.module ),
		[ $module.module ]
	);

	// The store only counts a module as updating once its request starts, and a queued
	// request has not started yet. Without this a switch waiting its turn looks untouched
	// and stays clickable, which is how a second, contradicting request gets sent.
	const [ isQueued, setIsQueued ] = useState( false );
	const isUpdating = isQueued || storeIsUpdating;

	const showToggleNotice = useCallback(
		async ( {
			noticeType,
			action,
		}: {
			noticeType: 'success' | 'error';
			action: 'activation' | 'deactivation';
		} ) => {
			if ( noticeType === 'success' ) {
				const message =
					action === 'activation'
						? getModuleActivationMessage( $module.module, $module.name )
						: sprintf(
								/* translators: %s is the module name */
								__( '%s has been deactivated.', 'jetpack-my-jetpack' ),
								$module.name
							);
				createSuccessNotice( message );
			} else {
				const message =
					action === 'activation'
						? sprintf(
								/* translators: %s is the module name */
								__( 'Failed to activate %s.', 'jetpack-my-jetpack' ),
								$module.name
							)
						: sprintf(
								/* translators: %s is the module name */
								__( 'Failed to deactivate %s.', 'jetpack-my-jetpack' ),
								$module.name
							);

				createErrorNotice( message );
			}
		},
		[ $module.module, $module.name, createErrorNotice, createSuccessNotice ]
	);

	const setModuleActive = useCallback(
		async ( active: boolean ) => {
			// Track module activation/deactivation if we're in the Products tab context
			if ( trackProductAction ) {
				trackProductAction( {
					action: active ? 'activate' : 'deactivate',
					productSlug: $module.module,
					productType: 'module',
					productStatus: $module.activated ? 'active' : 'inactive',
					productData: $module,
				} );
			}

			setIsQueued( true );

			let success;
			try {
				success = await queueActivationRequest( () =>
					toggleModule( {
						name: $module.module,
						active,
					} )
				);
			} finally {
				setIsQueued( false );
			}

			if ( success && reload && MODULES_REQUIRING_RELOAD.includes( $module.module ) ) {
				setPendingSuccessNotice(
					active
						? getModuleActivationMessage( $module.module, $module.name )
						: sprintf(
								/* translators: %s is the module name */
								__( '%s has been deactivated.', 'jetpack-my-jetpack' ),
								$module.name
							)
				);
				reloadPage();
				return;
			}

			await showToggleNotice( {
				noticeType: success ? 'success' : 'error',
				action: active ? 'activation' : 'deactivation',
			} );
		},
		[ toggleModule, $module, showToggleNotice, trackProductAction, reload ]
	);

	return { setModuleActive, isUpdating };
}

/**
 * Renders a toggle for a Jetpack module.
 *
 * @param {ModuleToggleProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModuleToggle( {
	module: $module,
	describedby,
	reloadAfterToggle = true,
}: ModuleToggleProps ) {
	const { setModuleActive, isUpdating } = useModuleActivation( $module, {
		reload: reloadAfterToggle,
	} );
	const blockThemeMigration = getBlockThemeMigration( $module );

	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setModuleActive( event.target.checked ),
		[ setModuleActive ]
	);
	const deactivateModule = useCallback( () => setModuleActive( false ), [ setModuleActive ] );

	if ( blockThemeMigration ) {
		if ( $module.activated ) {
			return (
				<SecondaryButton
					label={ blockThemeMigration.switchLabel }
					onClick={ deactivateModule }
					isLoading={ isUpdating }
					loadingAnnouncement={ blockThemeMigration.switchingAnnouncement }
				/>
			);
		}

		return (
			<SecondaryButton
				href={ blockThemeMigration.editorUrl }
				label={ __( 'Open Site Editor', 'jetpack-my-jetpack' ) }
			/>
		);
	}

	return (
		<FormToggle
			disabled={ isUpdating || !! $module.override }
			checked={ $module.activated }
			onChange={ onChange }
			aria-label={ sprintf(
				/* translators: %s is the module name */
				__( 'Toggle %s module', 'jetpack-my-jetpack' ),
				$module.name
			) }
			aria-describedby={ describedby }
		/>
	);
}
