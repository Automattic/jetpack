import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback } from 'react';
import { ModuleToggle } from '../../module-toggle';
import { getSwitchLabel } from '../utils';
import styles from './styles.module.scss';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';

type PluginToggleProps = {
	plugin: string;
	isOn: boolean;
	name: string;
	describedby?: string;
};

/**
 * The card switch for a feature switched by its standalone plugin.
 *
 * @param {PluginToggleProps} props             - The component props.
 * @param {string}            props.plugin      - The plugin's slug.
 * @param {boolean}           props.isOn        - Whether the plugin is active.
 * @param {string}            props.name        - The feature's name, for the label and notice.
 * @param {string}            props.describedby - Id of the element stating whether it is on.
 * @return The rendered component.
 */
function PluginToggle( { plugin, isOn, name, describedby }: PluginToggleProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const onChange = useCallback( () => run( isOn ? 'deactivate' : 'activate' ), [ isOn, run ] );

	return (
		<FormToggle
			checked={ isOn }
			disabled={ isBusy }
			onChange={ onChange }
			aria-label={ getSwitchLabel( isOn, name ) }
			aria-describedby={ describedby }
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
	const busyLabel =
		action === 'install'
			? __( 'Installing…', 'jetpack-my-jetpack' )
			: __( 'Activating…', 'jetpack-my-jetpack' );

	return (
		<Button
			variant="outline"
			size="compact"
			disabled={ isBusy }
			aria-busy={ isBusy || undefined }
			onClick={ onClick }
		>
			{ isBusy ? busyLabel : label }
		</Button>
	);
}

type FeatureActionProps = {
	state: FeatureState;
	describedby?: string;
};

/**
 * The card's control, as the feature map decides it.
 *
 * Nothing here reloads the page, unlike the Products tab's switches, so several features
 * can be flipped in a row; the wp-admin sidebar is refreshed in place after each switch
 * (see `use-sidebar-sync.ts`).
 *
 * @param {FeatureActionProps} props             - The component props.
 * @param {FeatureState}       props.state       - Live state for the feature.
 * @param {string}             props.describedby - Id of the element stating whether it is on.
 * @return The rendered component, or null when nothing here can switch the feature.
 */
export function FeatureAction( { state, describedby }: FeatureActionProps ) {
	const { control, feature } = state;
	const pluginName = feature.plugin_name || feature.name;

	if ( state.pending ) {
		return (
			// The size of the FormToggle it stands in for, so the row does not resize.
			<LoadingPlaceholder width={ 32 } height={ 16 } className={ styles[ 'skeleton-switch' ] } />
		);
	}

	switch ( control.kind ) {
		case 'module':
			// FeatureItem shows why, under the description: this slot does not shrink.
			if ( control.module.override ) {
				return null;
			}

			return (
				<ModuleToggle
					module={ control.module }
					reloadAfterToggle={ false }
					describedby={ describedby }
				/>
			);

		case 'plugin':
			if ( control.override ) {
				return null;
			}

			return (
				<PluginToggle
					plugin={ control.plugin }
					isOn={ state.status === 'active' }
					name={ pluginName }
					describedby={ describedby }
				/>
			);

		case 'install-plugin':
			// FeatureInstallNotice says why, under the description.
			if ( control.blocked ) {
				return null;
			}

			return (
				<InstallButton
					plugin={ control.plugin }
					name={ pluginName }
					label={ __( 'Install', 'jetpack-my-jetpack' ) }
					action="install"
				/>
			);

		case 'install-jetpack':
			if ( control.blocked ) {
				return null;
			}

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
