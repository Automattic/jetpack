import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { QueryClientContext, type QueryClient } from '@tanstack/react-query';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Switch } from '@wordpress/ui';
import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { QUERY_PRODUCT_BY_OWNERSHIP_KEY } from '../../data/constants';
import {
	asksBeforeSwitchingOff,
	mayHaveRunningCampaigns,
	requestModuleSwitch,
} from '../../data/module-switch';
import { moduleSwitchKey, useRequestedSwitch } from '../../data/requested-switch-state';
import {
	askSwitchOff,
	holdSwitchOff,
	releaseSwitchOff,
	useSwitchOffHold,
} from '../../data/switch-off-hold';
import { MyJetpackModule } from '../../types';
import { getBlockThemeMigration } from '../../utils/block-theme-migration';
import { getModuleActivationMessage } from '../../utils/module-benefit-messages';
import { setPendingSuccessNotice } from '../../utils/pending-notice';
import { reloadPage } from '../../utils/reload-page';
import SecondaryButton from '../action-button/secondary-button';
import { BlazeCampaignsWarning } from './blaze-campaigns-warning';

export type ModuleToggleProps = {
	module: MyJetpackModule;
	describedby?: string;
	/** The id of the text that names the switch, in place of its default label. */
	labelledby?: string;
	/** Locks the switch, for a module the site cannot use. */
	disabled?: boolean;
	/** False keeps the page in place, leaving the sidebar to catch up on the next load. */
	reloadAfterToggle?: boolean;
	/** Called with what the click asked for as its request starts, for surfaces that record their own events. */
	onSwitch?: ( active: boolean ) => void;
	/** Called when the switch's confirmation sends the visitor to manage the feature. */
	onManageClick?: () => void;
	/** Where Features opens the feature, for the confirmation's link to it. */
	manageUrl?: string;
};

type ModuleActivationOptions = Pick<
	ModuleToggleProps,
	'onSwitch' | 'onManageClick' | 'manageUrl'
> & {
	reload?: boolean;
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
 * @param $module               - The module to switch.
 * @param options               - Hook options.
 * @param options.reload        - False skips the sidebar reload, for surfaces where several
 *                              switches are flipped in a row.
 * @param options.onSwitch      - Called with the asked-for value as the switch's request starts,
 *                              after any confirmation, so never for a declined one.
 * @param options.onManageClick - Called when the confirmation sends the visitor to manage the feature.
 * @param options.manageUrl     - Where Features opens the feature, for the confirmation's link to it.
 * @return The handler, whether a mutation is in flight, the value to show meanwhile, and the
 * confirmation the surface renders for a switch that asks first.
 */
export function useModuleActivation(
	$module: MyJetpackModule,
	{ reload = true, onSwitch, onManageClick, manageUrl }: ModuleActivationOptions = {}
) {
	const { updateJetpackModuleStatus: toggleModule } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	// Read optionally: not every surface that renders a switch sits inside a QueryClientProvider.
	const queryClient = useContext( QueryClientContext ) as QueryClient | undefined;

	const storeIsUpdating = useSelect(
		select => select( modulesStore ).isModuleUpdating( $module.module ),
		[ $module.module ]
	);

	// The store only learns the new value once the request comes back, so the switch takes
	// the value the click asked for and holds it until then.
	const requested = useRequestedSwitch( moduleSwitchKey( $module.module ) );
	const isActive = requested ?? $module.activated;
	const hold = useSwitchOffHold( $module.module );
	// The switch-off this mount holds, read by its async check and released when the mount
	// moves to another module or unmounts, so a late answer finds it gone.
	const ownHold = useRef< { slug: string; token: number } | null >( null );
	const [ ownToken, setOwnToken ] = useState< number | null >( null );

	useLayoutEffect( () => {
		return () => {
			const own = ownHold.current;
			ownHold.current = null;
			if ( own ) {
				releaseSwitchOff( own.slug, own.token );
			}
		};
	}, [ $module.module ] );

	// Busy from the click, not from the request starting: the store only counts a module
	// as updating once its turn comes, and a queued switch that looks untouched stays
	// clickable. Read from the shared value, so the card and the modal agree.
	const isUpdating = requested !== null || storeIsUpdating || hold !== null;

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
				createSuccessNotice( message, { type: 'snackbar' } );
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

				createErrorNotice( message, { type: 'snackbar' } );
			}
		},
		[ $module.module, $module.name, createErrorNotice, createSuccessNotice ]
	);

	const switchModule = useCallback(
		async ( active: boolean ) => {
			onSwitch?.( active );
			const success = await requestModuleSwitch( toggleModule, $module.module, active );

			if ( success ) {
				// A switch can move the product between the owned and unowned groups.
				queryClient?.invalidateQueries( { queryKey: [ QUERY_PRODUCT_BY_OWNERSHIP_KEY ] } );
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
		[ toggleModule, $module, showToggleNotice, reload, onSwitch, queryClient ]
	);

	const setModuleActive = useCallback(
		async ( active: boolean ) => {
			if ( active || ! asksBeforeSwitchingOff( $module ) ) {
				return switchModule( active );
			}

			// Another surface is already checking or asking about this module.
			const token = holdSwitchOff( $module.module );
			if ( token === null ) {
				return;
			}

			const own = { slug: $module.module, token };
			ownHold.current = own;
			setOwnToken( token );

			const mayBeRunning = await mayHaveRunningCampaigns();
			if ( ownHold.current !== own ) {
				return;
			}

			if ( mayBeRunning ) {
				askSwitchOff( own.slug, token );
				return;
			}

			ownHold.current = null;
			// Switched before the release, so the asked-for value takes over without a gap.
			const switched = switchModule( false );
			releaseSwitchOff( own.slug, token );
			return switched;
		},
		[ $module, switchModule ]
	);

	const endAsking = useCallback(
		( switchOff: boolean ) => {
			const own = ownHold.current;
			if ( ! own || own.slug !== $module.module ) {
				return;
			}

			ownHold.current = null;
			if ( switchOff ) {
				switchModule( false );
			}
			releaseSwitchOff( own.slug, own.token );
		},
		[ $module.module, switchModule ]
	);
	const keep = useCallback( () => endAsking( false ), [ endAsking ] );
	const switchOffAnyway = useCallback( () => endAsking( true ), [ endAsking ] );
	const manageCampaigns = useCallback( () => {
		onManageClick?.();
		endAsking( false );
	}, [ endAsking, onManageClick ] );

	const confirmation =
		hold?.asking && hold.token === ownToken ? (
			<BlazeCampaignsWarning
				onKeep={ keep }
				onSwitchOff={ switchOffAnyway }
				onManageClick={ manageCampaigns }
				manageUrl={ manageUrl }
			/>
		) : null;

	return { setModuleActive, isUpdating, isActive, confirmation };
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
	labelledby,
	disabled = false,
	reloadAfterToggle = true,
	onSwitch,
	onManageClick,
	manageUrl,
}: ModuleToggleProps ) {
	const { setModuleActive, isUpdating, isActive, confirmation } = useModuleActivation( $module, {
		reload: reloadAfterToggle,
		onSwitch,
		onManageClick,
		manageUrl,
	} );
	const blockThemeMigration = getBlockThemeMigration( $module );

	const deactivateModule = useCallback( () => setModuleActive( false ), [ setModuleActive ] );

	if ( blockThemeMigration ) {
		// The stored value, not the asked-for one: the two branches are different actions,
		// so answering the click early would swap the button for a link to somewhere else.
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
				href={ blockThemeMigration.settingsUrl }
				label={ __( 'Configure', 'jetpack-my-jetpack' ) }
			/>
		);
	}

	return (
		<>
			<Switch
				disabled={ disabled || isUpdating || !! $module.override }
				checked={ isActive }
				onCheckedChange={ setModuleActive }
				aria-label={
					labelledby
						? undefined
						: sprintf(
								/* translators: %s is the module name */
								__( 'Toggle %s module', 'jetpack-my-jetpack' ),
								$module.name
							)
				}
				aria-labelledby={ labelledby }
				aria-describedby={ describedby }
			/>
			{ confirmation }
		</>
	);
}
