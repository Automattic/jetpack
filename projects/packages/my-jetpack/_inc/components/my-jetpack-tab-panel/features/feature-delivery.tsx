import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
import { getForcedReason, getInstallBlockReason, getModuleUnavailableNote } from './feature-state';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureDeliveryProps = {
	state: FeatureState;
};

/**
 * What the modal's button will do, with `<plugin>` marking the plugin's name.
 *
 * @param state      - Live state for the feature.
 * @param pluginName - The standalone plugin's name.
 * @return The note, or an empty string when there is nothing to explain.
 */
function getNote( state: FeatureState, pluginName: string ): string {
	const { feature, control } = state;

	// A blocked install has no button to describe, so the note says why instead.
	const blockedReason = getInstallBlockReason( state );
	if ( blockedReason ) {
		return blockedReason;
	}

	switch ( control.kind ) {
		case 'install-plugin': {
			const installNote = sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'Installing adds the free <plugin>%s</plugin> plugin and turns it on. You won’t be charged.',
					'jetpack-my-jetpack'
				),
				pluginName
			);
			const installAndConnectNote = sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'Installing adds the free <plugin>%s</plugin> plugin and turns it on, then connects your WordPress.com account. You won’t be charged.',
					'jetpack-my-jetpack'
				),
				pluginName
			);
			return state.accountNeeded ? installAndConnectNote : installNote;
		}

		case 'plugin': {
			const activateNote = sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'The <plugin>%s</plugin> plugin is already installed. Activating turns it on.',
					'jetpack-my-jetpack'
				),
				pluginName
			);
			const connectNote = sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'The <plugin>%s</plugin> plugin is already installed. Connect your WordPress.com account, then turn it on here.',
					'jetpack-my-jetpack'
				),
				pluginName
			);
			return state.accountNeeded ? connectNote : activateNote;
		}

		case 'module': {
			const moduleNote = __(
				'Built into Jetpack, so there is nothing to install. Activating turns it on.',
				'jetpack-my-jetpack'
			);
			const connectFirstNote = __(
				'Built into Jetpack, so there is nothing to install. Connect your WordPress.com account, then turn it on here if it’s still off.',
				'jetpack-my-jetpack'
			);
			return state.accountNeeded ? connectFirstNote : moduleNote;
		}

		case 'install-jetpack': {
			const jetpackNote = sprintf(
				/* translators: %s is a feature name, such as "Stats". */
				__(
					'%s is part of the Jetpack plugin. Installing Jetpack turns it on. You won’t be charged.',
					'jetpack-my-jetpack'
				),
				feature.name
			);
			const jetpackConnectNote = sprintf(
				/* translators: %s is a feature name, such as "Activity Log". */
				__(
					'%s is part of the Jetpack plugin. After installing Jetpack you’ll connect your WordPress.com account, then you can turn it on here if it’s still off. You won’t be charged.',
					'jetpack-my-jetpack'
				),
				feature.name
			);
			return state.accountNeeded ? jetpackConnectNote : jetpackNote;
		}

		default:
			return '';
	}
}

/**
 * The module limitation and the action's setup note in the feature details.
 *
 * @param {FeatureDeliveryProps} props       - The component props.
 * @param {FeatureState}         props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureDelivery( { state }: FeatureDeliveryProps ) {
	const { feature } = state;
	const moduleNote = getModuleUnavailableNote( state );
	const isSettled = state.status === 'active' || Boolean( getForcedReason( state ) );
	// An active plugin does not remove its module's limitation.
	// One still waiting for an account keeps its setup note, since that step is still ahead.
	if ( isSettled && ! state.accountNeeded ) {
		return moduleNote ? <Text variant="body-sm">{ moduleNote }</Text> : null;
	}

	const pluginName = feature.plugin_name || feature.name;
	const note = isSettled ? '' : getNote( state, pluginName );
	// A blocked install never reaches the next step, so naming it would only mislead.
	const setupNote = getInstallBlockReason( state ) ? '' : feature.setup_note;

	if ( ! note && ! setupNote ) {
		return null;
	}

	return (
		<Stack direction="row" align="start" gap="sm" className={ styles[ 'delivery-note' ] }>
			<Icon icon={ info } size={ 20 } className={ styles[ 'inline-icon' ] } />
			{ /* Separate sentences rather than a joined string: not every script spaces them. */ }
			<Stack direction="column" gap="xs">
				{ moduleNote ? <Text variant="body-sm">{ moduleNote }</Text> : null }
				{ note ? (
					<Text variant="body-sm">
						{ createInterpolateElement( note, {
							plugin: feature.plugin_url ? (
								<a href={ feature.plugin_url } target="_blank" rel="noreferrer" />
							) : (
								<span />
							),
						} ) }
					</Text>
				) : null }
				{ setupNote ? <Text variant="body-sm">{ setupNote }</Text> : null }
			</Stack>
		</Stack>
	);
}
