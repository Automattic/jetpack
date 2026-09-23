import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { getForcedReason } from './feature-state';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureDeliveryProps = {
	state: FeatureState;
};

/**
 * The note under "How to get it", naming what the modal's button will do.
 *
 * @param state      - Live state for the feature.
 * @param pluginName - The standalone plugin's name.
 * @return The note, or an empty string when there is nothing to explain.
 */
function getNote( state: FeatureState, pluginName: string ): string {
	const { feature, control } = state;

	// Each note describes the modal's button, and a blocked install has none.
	if ( 'blocked' in control && control.blocked ) {
		return '';
	}

	switch ( control.kind ) {
		case 'install-plugin':
			return sprintf(
				/* translators: 1: a plugin name, 2: a feature name. */
				__(
					'Install adds the %1$s plugin, then turns %2$s on for your site. It does not buy anything.',
					'jetpack-my-jetpack'
				),
				pluginName,
				feature.name
			);

		case 'plugin':
			return sprintf(
				/* translators: 1: a plugin name, 2: a feature name. */
				__(
					'Activate switches on the %1$s plugin, already installed here, and turns %2$s on for your site.',
					'jetpack-my-jetpack'
				),
				pluginName,
				feature.name
			);

		case 'module':
			return sprintf(
				/* translators: %s is a feature name, such as "Stats". */
				__(
					'Activate turns %s on for your site. There is nothing to install, and it does not buy anything.',
					'jetpack-my-jetpack'
				),
				feature.name
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
 * Where an inactive feature comes from, and what the button will do to get it.
 *
 * Only shown while the feature is off: once it is running, how it arrived is no
 * longer the question the reader has.
 *
 * @param {FeatureDeliveryProps} props       - The component props.
 * @param {FeatureState}         props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureDelivery( { state }: FeatureDeliveryProps ) {
	const { feature } = state;

	if ( state.status === 'active' ) {
		return null;
	}

	// Forced off: say why it can't be had here instead of how to get it.
	const forcedReason = getForcedReason( state );
	if ( forcedReason ) {
		return (
			<section className={ styles[ 'detail-section' ] }>
				<Text variant="heading-sm" render={ <h3 /> }>
					{ __( 'How to get it', 'jetpack-my-jetpack' ) }
				</Text>
				<Stack direction="row" align="center" gap="sm" wrap="wrap">
					<Badge intent="medium">{ forcedReason }</Badge>
				</Stack>
			</section>
		);
	}

	const pluginName = feature.plugin_name || feature.name;
	const note = getNote( state, pluginName );

	if ( ! feature.in_jetpack && ! feature.plugin && ! note ) {
		return null;
	}

	return (
		<section className={ styles[ 'detail-section' ] }>
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'How to get it', 'jetpack-my-jetpack' ) }
			</Text>

			<Stack direction="row" align="center" gap="sm" wrap="wrap">
				{ feature.in_jetpack ? (
					<Badge intent="stable">{ __( 'In Jetpack', 'jetpack-my-jetpack' ) }</Badge>
				) : null }
				{ feature.plugin && feature.plugin_url ? (
					<a
						href={ feature.plugin_url }
						target="_blank"
						rel="noreferrer"
						className={ styles[ 'badge-link' ] }
						title={ sprintf(
							/* translators: %s is a plugin name, such as "Jetpack Protect". */
							__( 'View %s on WordPress.org', 'jetpack-my-jetpack' ),
							pluginName
						) }
					>
						<Badge intent="informational">{ pluginName }</Badge>
					</a>
				) : null }
			</Stack>

			{ note ? <Text variant="body-sm">{ note }</Text> : null }
		</section>
	);
}
