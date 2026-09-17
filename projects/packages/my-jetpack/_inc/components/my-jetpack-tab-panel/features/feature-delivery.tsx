import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureDeliveryProps = {
	state: FeatureState;
};

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
	const { feature, product } = state;
	// Saying "In Jetpack" to someone already running Jetpack tells them nothing.
	const inJetpack = !! feature.delivery?.in_jetpack && ! isJetpackPluginActive();
	const { standalone } = feature.delivery ?? {};

	if ( state.status === 'active' ) {
		return null;
	}

	// The product's own plugin slug is the wordpress.org one.
	const repoUrl = product?.pluginSlug
		? `https://wordpress.org/plugins/${ product.pluginSlug }/`
		: '';

	// Named for the button it describes, so the two cannot be read as different things.
	// Only claim a plugin is involved when this product actually has one waiting.
	const installedStandalone =
		!! standalone && !! product?.standalonePluginInfo?.isStandaloneInstalled;

	const consequence = () => {
		if ( state.action === 'install' && standalone ) {
			return sprintf(
				/* translators: 1: a plugin name, 2: a feature name. */
				__(
					'Install adds the %1$s plugin, then turns %2$s on for your site. It does not buy anything.',
					'jetpack-my-jetpack'
				),
				standalone,
				feature.name
			);
		}

		if ( state.action === 'activate' && installedStandalone ) {
			return sprintf(
				/* translators: 1: a plugin name, 2: a feature name. */
				__(
					'Activate switches on the %1$s plugin, already installed here, and turns %2$s on for your site.',
					'jetpack-my-jetpack'
				),
				standalone,
				feature.name
			);
		}

		if ( state.action === 'install' || state.action === 'activate' ) {
			return sprintf(
				/* translators: %s is a feature name, such as "Protect". */
				__(
					'Activate turns %s on for your site. There is nothing to install, and it does not buy anything.',
					'jetpack-my-jetpack'
				),
				feature.name
			);
		}

		return '';
	};

	const note = consequence();

	if ( ! inJetpack && ! standalone && ! note ) {
		return null;
	}

	return (
		<section className={ styles[ 'detail-section' ] }>
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'How to get it', 'jetpack-my-jetpack' ) }
			</Text>

			<Stack direction="row" align="center" gap="sm" wrap="wrap">
				{ inJetpack ? (
					<Badge intent="stable">{ __( 'In Jetpack', 'jetpack-my-jetpack' ) }</Badge>
				) : null }
				{ standalone && repoUrl ? (
					<a
						href={ repoUrl }
						target="_blank"
						rel="noreferrer"
						className={ styles[ 'badge-link' ] }
						title={ sprintf(
							/* translators: %s is a plugin name, such as "Jetpack Protect". */
							__( 'View %s on WordPress.org', 'jetpack-my-jetpack' ),
							standalone
						) }
					>
						<Badge intent="informational">{ standalone }</Badge>
					</a>
				) : null }
				{ standalone && ! repoUrl ? <Badge intent="informational">{ standalone }</Badge> : null }
			</Stack>

			{ note ? <Text variant="body-sm">{ note }</Text> : null }
		</section>
	);
}
