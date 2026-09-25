import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
import { getForcedReason } from './feature-state';
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

	switch ( control.kind ) {
		case 'install-plugin':
			return sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'Installing adds the <plugin>%s</plugin> plugin and turns it on. It does not buy anything.',
					'jetpack-my-jetpack'
				),
				pluginName
			);

		case 'plugin':
			return sprintf(
				/* translators: %s is a plugin name. Keep the <plugin> tags around it. */
				__(
					'The <plugin>%s</plugin> plugin is already installed. Activating turns it on.',
					'jetpack-my-jetpack'
				),
				pluginName
			);

		case 'module':
			return __(
				'Built into Jetpack. Activating turns it on, with nothing to install or buy.',
				'jetpack-my-jetpack'
			);

		case 'install-jetpack':
			return sprintf(
				/* translators: %s is a feature name, such as "Stats". */
				__(
					'%s is part of the Jetpack plugin. Installing Jetpack turns it on; it does not buy anything.',
					'jetpack-my-jetpack'
				),
				feature.name
			);

		default:
			return '';
	}
}

/**
 * What the button beside an inactive feature's name will do to turn it on.
 *
 * @param {FeatureDeliveryProps} props       - The component props.
 * @param {FeatureState}         props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureDelivery( { state }: FeatureDeliveryProps ) {
	const { feature } = state;

	// Once it runs, how it arrived is no longer the question; forced off, the header badge says why.
	if ( state.status === 'active' || getForcedReason( state ) ) {
		return null;
	}

	const pluginName = feature.plugin_name || feature.name;
	const note = getNote( state, pluginName );

	if ( ! note ) {
		return null;
	}

	return (
		<Stack direction="row" align="start" gap="sm" className={ styles[ 'delivery-note' ] }>
			<Icon icon={ info } size={ 20 } className={ styles[ 'inline-icon' ] } />
			<Text variant="body-sm">
				{ createInterpolateElement( note, {
					plugin: feature.plugin_url ? (
						<a href={ feature.plugin_url } target="_blank" rel="noreferrer" />
					) : (
						<span />
					),
				} ) }
			</Text>
		</Stack>
	);
}
