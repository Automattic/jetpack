import { __ } from '@wordpress/i18n';
import { Badge, Button, ButtonLink, Stack } from '@wordpress/ui';
import { useCallback, useEffect, useRef } from 'react';
import { useModuleActivation } from '../../module-toggle';
import { getSwitchLabel } from '../utils';
import { ConnectButton, InstallButton, JetpackButton } from './feature-action';
import { UpgradeButton } from './feature-paid';
import { getFeatureManageUrl, getForcedReason, offersConnect } from './feature-state';
import { useFeaturesTracking } from './features-tracking-context';
import { getFeatureUnavailableReason } from './module-availability';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

type SwitchButtonProps = {
	isOn: boolean;
	name: string;
	disabled: boolean;
	onClick: () => void;
};

/**
 * The modal's Activate/Deactivate button, whichever mechanism switches the feature.
 *
 * @param {SwitchButtonProps} props          - The component props.
 * @param {boolean}           props.isOn     - Whether the feature is on.
 * @param {string}            props.name     - The feature's name, for the label.
 * @param {boolean}           props.disabled - Whether a switch is in flight.
 * @param {Function}          props.onClick  - Flips the feature.
 * @return The rendered component.
 */
function SwitchButton( { isOn, name, disabled, onClick }: SwitchButtonProps ) {
	const deactivateText = __( 'Deactivate', 'jetpack-my-jetpack' );
	const activateText = __( 'Activate', 'jetpack-my-jetpack' );

	return (
		<Button
			variant={ isOn ? 'outline' : 'solid' }
			size="compact"
			disabled={ disabled }
			onClick={ onClick }
			aria-label={ getSwitchLabel( isOn, name ) }
		>
			{ isOn ? deactivateText : activateText }
		</Button>
	);
}

type ModuleSwitchProps = {
	state: FeatureState;
	module: MyJetpackModule;
	name: string;
};

/**
 * Switch a module-backed feature.
 *
 * @param {ModuleSwitchProps} props        - The component props.
 * @param {FeatureState}      props.state  - Live state for the feature.
 * @param {MyJetpackModule}   props.module - The module behind the feature.
 * @param {string}            props.name   - The feature's name, for the label.
 * @return The rendered component.
 */
function ModuleSwitch( { state, module: $module, name }: ModuleSwitchProps ) {
	const { setModuleActive, isUpdating, isActive } = useModuleActivation( $module, {
		reload: false,
	} );
	const tracking = useFeaturesTracking();
	const onClick = useCallback( () => {
		tracking?.trackFeatureAction( {
			state,
			action: isActive ? 'deactivate' : 'activate',
			origin: 'modal',
		} );
		setModuleActive( ! isActive );
	}, [ isActive, setModuleActive, state, tracking ] );

	return (
		<SwitchButton
			isOn={ isActive }
			name={ name }
			disabled={ isUpdating || ! $module.available || !! $module.override }
			onClick={ onClick }
		/>
	);
}

type PluginSwitchProps = {
	state: FeatureState;
	plugin: string;
	isOn: boolean;
	name: string;
};

/**
 * Switch a feature by its installed standalone plugin.
 *
 * @param {PluginSwitchProps} props        - The component props.
 * @param {FeatureState}      props.state  - Live state for the feature.
 * @param {string}            props.plugin - The plugin's slug.
 * @param {boolean}           props.isOn   - Whether the plugin is active.
 * @param {string}            props.name   - The plugin's name, for the label and notice.
 * @return The rendered component.
 */
function PluginSwitch( { state, plugin, isOn, name }: PluginSwitchProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const tracking = useFeaturesTracking();
	const onClick = useCallback( () => {
		tracking?.trackFeatureAction( {
			state,
			action: isOn ? 'deactivate' : 'activate',
			origin: 'modal',
		} );
		run( isOn ? 'deactivate' : 'activate' );
	}, [ isOn, run, state, tracking ] );

	return <SwitchButton isOn={ isOn } name={ name } disabled={ isBusy } onClick={ onClick } />;
}

type FeatureModalActionsProps = {
	state: FeatureState;
};

/**
 * What the modal offers: Open once running, Connect when only the account is missing (Deactivate
 * while still on), the switch, Install or Install Jetpack, and Upgrade where a plan sells more.
 *
 * @param {FeatureModalActionsProps} props       - The component props.
 * @param {FeatureState}             props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureModalActions( { state }: FeatureModalActionsProps ) {
	const { feature, control } = state;
	const manageUrl = getFeatureManageUrl( state );
	const isActive = state.status === 'active';
	const pluginName = feature.plugin_name || feature.name;
	const forcedReason = getForcedReason( state );
	const unavailable = getFeatureUnavailableReason( state );
	const connectFirst = offersConnect( state );
	// Waiting for an account, the switch only stays to turn off a feature already on, and
	// until that request lands, so the button being pressed does not vanish under the click.
	const showSwitch =
		! forcedReason && ( ! connectFirst || isActive || Boolean( state.isSwitching ) );
	const tracking = useFeaturesTracking();
	const connectRef = useRef< HTMLButtonElement >( null );
	const hadSwitch = useRef( showSwitch );

	// Once the feature is off its Deactivate goes; focus left on the page moves to Connect.
	useEffect( () => {
		const active = connectRef.current?.ownerDocument.activeElement;
		if ( hadSwitch.current && ! showSwitch && ( ! active || active.tagName === 'BODY' ) ) {
			connectRef.current?.focus();
		}
		hadSwitch.current = showSwitch;
	}, [ showSwitch ] );

	// Leaves for the feature's own screen, so the event has to be away before it does.
	const onManageClick = useCallback(
		() => tracking?.trackManageClick( state ),
		[ state, tracking ]
	);

	return (
		<>
			{ isActive && manageUrl ? (
				<ButtonLink href={ manageUrl } variant="solid" size="compact" onClick={ onManageClick }>
					{ __( 'Open', 'jetpack-my-jetpack' ) }
				</ButtonLink>
			) : null }

			{ forcedReason ? (
				<Stack direction="column" align="start" gap="xs">
					{ unavailable && unavailable !== forcedReason ? (
						<Badge intent="medium">{ unavailable }</Badge>
					) : null }
					<Badge intent="medium">{ forcedReason }</Badge>
				</Stack>
			) : null }

			{ connectFirst ? (
				<ConnectButton state={ state } origin="modal" buttonRef={ connectRef } />
			) : null }

			{ control.kind === 'module' && showSwitch ? (
				<ModuleSwitch state={ state } module={ control.module } name={ feature.name } />
			) : null }

			{ control.kind === 'plugin' && showSwitch ? (
				<PluginSwitch
					state={ state }
					plugin={ control.plugin }
					isOn={ isActive }
					name={ pluginName }
				/>
			) : null }

			{ control.kind === 'install-plugin' && ! control.blocked ? (
				<InstallButton
					state={ state }
					origin="modal"
					plugin={ control.plugin }
					name={ pluginName }
					label={ __( 'Install', 'jetpack-my-jetpack' ) }
					action="install"
				/>
			) : null }

			{ control.kind === 'plan' && control.activatePlugin && feature.included ? (
				<InstallButton
					state={ state }
					origin="modal"
					plugin={ control.activatePlugin }
					name={ pluginName }
					label={ __( 'Activate', 'jetpack-my-jetpack' ) }
					action="activate"
				/>
			) : null }

			{ control.kind === 'install-jetpack' && ! control.blocked ? (
				<JetpackButton state={ state } origin="modal" installed={ control.installed } />
			) : null }

			<UpgradeButton state={ state } />
		</>
	);
}
