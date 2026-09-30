import { __ } from '@wordpress/i18n';
import { Badge, Button, LinkButton } from '@wordpress/ui';
import { useCallback } from 'react';
import { useModuleActivation } from '../../module-toggle';
import { getSwitchLabel } from '../utils';
import { InstallButton, JetpackButton } from './feature-action';
import { getForcedReason } from './feature-state';
import { useFeaturesTracking } from './features-tracking-context';
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
 * What the modal offers to do with a feature: Open once it is running, and the button
 * that switches it, installs its plugin, or installs Jetpack.
 *
 * @param {FeatureModalActionsProps} props       - The component props.
 * @param {FeatureState}             props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureModalActions( { state }: FeatureModalActionsProps ) {
	const { feature, control } = state;
	const isActive = state.status === 'active';
	const pluginName = feature.plugin_name || feature.name;
	const forcedReason = getForcedReason( state );
	const tracking = useFeaturesTracking();

	// Leaves for the feature's own screen, so the event has to be away before it does.
	const onManageClick = useCallback(
		() => tracking?.trackManageClick( state ),
		[ state, tracking ]
	);

	return (
		<>
			{ isActive && feature.manage_url ? (
				<LinkButton
					href={ feature.manage_url }
					variant="solid"
					size="compact"
					onClick={ onManageClick }
				>
					{ __( 'Open', 'jetpack-my-jetpack' ) }
				</LinkButton>
			) : null }

			{ forcedReason ? <Badge intent="medium">{ forcedReason }</Badge> : null }

			{ control.kind === 'module' && ! forcedReason ? (
				<ModuleSwitch state={ state } module={ control.module } name={ feature.name } />
			) : null }

			{ control.kind === 'plugin' && ! forcedReason ? (
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

			{ control.kind === 'install-jetpack' && ! control.blocked ? (
				<JetpackButton state={ state } origin="modal" installed={ control.installed } />
			) : null }
		</>
	);
}
