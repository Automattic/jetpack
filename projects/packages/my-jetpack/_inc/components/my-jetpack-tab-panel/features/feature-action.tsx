import { FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback } from 'react';
import { ModuleToggle } from '../../module-toggle';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';

/**
 * The label for a control that switches a feature on or off.
 *
 * Both labels are bound before the branch: minification folds `c ? __( a ) : __( b )`
 * into one call with a ternary msgid, which the i18n build check rejects.
 *
 * @param isOn - Whether the feature is currently on.
 * @param name - The feature's name.
 * @return The label for what the control will do.
 */
export function getSwitchLabel( isOn: boolean, name: string ): string {
	const deactivateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Deactivate %s', 'jetpack-my-jetpack' ),
		name
	);
	const activateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Activate %s', 'jetpack-my-jetpack' ),
		name
	);

	return isOn ? deactivateLabel : activateLabel;
}

type PluginToggleProps = {
	plugin: string;
	isOn: boolean;
	name: string;
};

/**
 * The card switch for a feature switched by its standalone plugin.
 *
 * @param {PluginToggleProps} props        - The component props.
 * @param {string}            props.plugin - The plugin's slug.
 * @param {boolean}           props.isOn   - Whether the plugin is active.
 * @param {string}            props.name   - The feature's name, for the label and notice.
 * @return The rendered component.
 */
function PluginToggle( { plugin, isOn, name }: PluginToggleProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const onChange = useCallback( () => run( isOn ? 'deactivate' : 'activate' ), [ isOn, run ] );

	return (
		<FormToggle
			checked={ isOn }
			disabled={ isBusy }
			onChange={ onChange }
			aria-label={ getSwitchLabel( isOn, name ) }
		/>
	);
}

type InstallButtonProps = {
	plugin: string;
	name: string;
	label: string;
	action: 'install' | 'activate';
};

/**
 * A compact button that installs, or activates, the plugin a feature is waiting on.
 *
 * @param {InstallButtonProps} props        - The component props.
 * @param {string}             props.plugin - The plugin's slug, or `jetpack`.
 * @param {string}             props.name   - What to call it in the notice.
 * @param {string}             props.label  - The button's text.
 * @param {string}             props.action - Install when missing, activate when installed.
 * @return The rendered component.
 */
export function InstallButton( { plugin, name, label, action }: InstallButtonProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const onClick = useCallback( () => run( action ), [ action, run ] );

	return (
		<Button variant="outline" size="compact" disabled={ isBusy } onClick={ onClick }>
			{ label }
		</Button>
	);
}

type FeatureActionProps = {
	state: FeatureState;
};

/**
 * The card's control, as the feature map decides it.
 *
 * Nothing here reloads the page, though the Products tab's switches do, so that several
 * features can be flipped in a row; the wp-admin sidebar catches up on the next load.
 *
 * @param {FeatureActionProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component, or null when nothing here can switch the feature.
 */
export function FeatureAction( { state }: FeatureActionProps ) {
	const { control, feature } = state;
	const pluginName = feature.plugin_name || feature.name;

	switch ( control.kind ) {
		case 'module':
			return <ModuleToggle module={ control.module } reloadAfterToggle={ false } />;

		case 'plugin':
			return (
				<PluginToggle
					plugin={ control.plugin }
					isOn={ state.status === 'active' }
					name={ pluginName }
				/>
			);

		case 'install-plugin':
			return (
				<InstallButton
					plugin={ control.plugin }
					name={ pluginName }
					label={ __( 'Install', 'jetpack-my-jetpack' ) }
					action="install"
				/>
			);

		case 'install-jetpack':
			return <JetpackButton installed={ control.installed } />;

		default:
			return null;
	}
}

type JetpackButtonProps = {
	installed: boolean;
};

/**
 * Install, or activate, the Jetpack plugin for a feature only Jetpack ships.
 *
 * @param {JetpackButtonProps} props           - The component props.
 * @param {boolean}            props.installed - Whether Jetpack is installed but inactive.
 * @return The rendered component.
 */
export function JetpackButton( { installed }: JetpackButtonProps ) {
	// Bound before the branch, for the reason given by getSwitchLabel().
	const activateLabel = __( 'Activate Jetpack', 'jetpack-my-jetpack' );
	const installLabel = __( 'Install Jetpack', 'jetpack-my-jetpack' );

	return (
		<InstallButton
			plugin="jetpack"
			name="Jetpack"
			label={ installed ? activateLabel : installLabel }
			action={ installed ? 'activate' : 'install' }
		/>
	);
}
