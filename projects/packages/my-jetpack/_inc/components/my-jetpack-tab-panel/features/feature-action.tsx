import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, LinkButton } from '@wordpress/ui';
import { useCallback } from 'react';
import { ModuleToggle } from '../../module-toggle';
import { getSwitchLabel } from '../utils';
import { getForcedReason } from './feature-state';
import { useFeaturesTracking } from './features-tracking-context';
import styles from './styles.module.scss';
import { useFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';
import type { FeatureActionOrigin } from './features-tracking-context';

type PluginToggleProps = {
	state: FeatureState;
	origin: FeatureActionOrigin;
	plugin: string;
	isOn: boolean;
	name: string;
	describedby?: string;
};

/**
 * The card switch for a feature switched by its standalone plugin.
 *
 * @param {PluginToggleProps} props             - The component props.
 * @param {FeatureState}      props.state       - Live state for the feature.
 * @param {string}            props.origin      - Which list this control sits in.
 * @param {string}            props.plugin      - The plugin's slug.
 * @param {boolean}           props.isOn        - Whether the plugin is active.
 * @param {string}            props.name        - The feature's name, for the label and notice.
 * @param {string}            props.describedby - Id of the element stating whether it is on.
 * @return The rendered component.
 */
function PluginToggle( { state, origin, plugin, isOn, name, describedby }: PluginToggleProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const tracking = useFeaturesTracking();
	const onChange = useCallback( () => {
		tracking?.trackFeatureAction( {
			state,
			action: isOn ? 'deactivate' : 'activate',
			origin,
		} );
		run( isOn ? 'deactivate' : 'activate' );
	}, [ isOn, origin, run, state, tracking ] );

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
	state?: FeatureState;
	origin: FeatureActionOrigin;
	plugin: string;
	name: string;
	label: string;
	action: 'install' | 'activate';
};

/**
 * A compact button that installs, or activates, the plugin a feature is waiting on.
 *
 * @param {InstallButtonProps} props        - The component props.
 * @param {FeatureState}       props.state  - Live state for the feature, where it is one feature's.
 * @param {string}             props.origin - Whether the button is the card's or the modal's.
 * @param {string}             props.plugin - The plugin's slug, or `jetpack`.
 * @param {string}             props.name   - What to call it in the notice.
 * @param {string}             props.label  - The button's text.
 * @param {string}             props.action - Install when missing, activate when installed.
 * @return The rendered component.
 */
export function InstallButton( {
	state,
	origin,
	plugin,
	name,
	label,
	action,
}: InstallButtonProps ) {
	const { run, isBusy } = useFeaturePlugin( plugin, name );
	const tracking = useFeaturesTracking();
	const onClick = useCallback( () => {
		tracking?.trackFeatureAction( { state, action, origin } );
		run( action );
	}, [ action, origin, run, state, tracking ] );

	return (
		<Button variant="outline" size="compact" disabled={ isBusy } onClick={ onClick }>
			{ label }
		</Button>
	);
}

type FeatureActionProps = {
	state: FeatureState;
	describedby?: string;
	origin?: FeatureActionOrigin;
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
 * @param {string}             props.origin      - Which list this control sits in.
 * @return The rendered component, or null when nothing here can switch the feature.
 */
export function FeatureAction( { state, describedby, origin = 'card' }: FeatureActionProps ) {
	const { control, feature } = state;
	const pluginName = feature.plugin_name || feature.name;
	const tracking = useFeaturesTracking();

	const onModuleSwitch = useCallback(
		( active: boolean ) =>
			tracking?.trackFeatureAction( {
				state,
				action: active ? 'activate' : 'deactivate',
				origin,
			} ),
		[ origin, state, tracking ]
	);

	if ( state.pending ) {
		return (
			// The size of the FormToggle it stands in for, so the row does not resize.
			<LoadingPlaceholder width={ 32 } height={ 16 } className={ styles[ 'skeleton-switch' ] } />
		);
	}

	switch ( control.kind ) {
		case 'module': {
			// FeatureItem shows why, under the description: this slot does not shrink.
			if ( getForcedReason( state ) ) {
				return null;
			}

			return (
				<ModuleToggle
					module={ control.module }
					reloadAfterToggle={ false }
					describedby={ describedby }
					onSwitch={ onModuleSwitch }
				/>
			);
		}

		case 'plugin':
			if ( control.override ) {
				return null;
			}

			return (
				<PluginToggle
					state={ state }
					origin={ origin }
					plugin={ control.plugin }
					isOn={ state.status === 'active' }
					name={ pluginName }
					describedby={ describedby }
				/>
			);

		case 'install-plugin':
			// Already running on the plan, so the card opens it; Install stays in the modal.
			if ( control.runsWithoutPlugin && feature.manage_url ) {
				return (
					<LinkButton href={ feature.manage_url } variant="outline" size="compact">
						{ __( 'Open', 'jetpack-my-jetpack' ) }
					</LinkButton>
				);
			}

			return (
				<InstallButton
					state={ state }
					origin={ origin }
					plugin={ control.plugin }
					name={ pluginName }
					label={ __( 'Install', 'jetpack-my-jetpack' ) }
					action="install"
				/>
			);

		case 'install-jetpack':
			return <JetpackButton state={ state } origin={ origin } installed={ control.installed } />;

		default:
			return null;
	}
}

type JetpackButtonProps = {
	state?: FeatureState;
	origin?: FeatureActionOrigin;
	installed: boolean;
};

/**
 * Install, or activate, the Jetpack plugin for a feature only Jetpack ships.
 *
 * @param {JetpackButtonProps} props           - The component props.
 * @param {FeatureState}       props.state     - Live state for the feature, where it is one feature's.
 * @param {string}             props.origin    - Which control this is; the More Features section's by default.
 * @param {boolean}            props.installed - Whether Jetpack is installed but inactive.
 * @return The rendered component.
 */
export function JetpackButton( {
	state,
	origin = 'more_features',
	installed,
}: JetpackButtonProps ) {
	const activateLabel = __( 'Activate Jetpack', 'jetpack-my-jetpack' );
	const installLabel = __( 'Install Jetpack', 'jetpack-my-jetpack' );

	return (
		<InstallButton
			state={ state }
			origin={ origin }
			plugin="jetpack"
			name="Jetpack"
			label={ installed ? activateLabel : installLabel }
			action={ installed ? 'activate' : 'install' }
		/>
	);
}
