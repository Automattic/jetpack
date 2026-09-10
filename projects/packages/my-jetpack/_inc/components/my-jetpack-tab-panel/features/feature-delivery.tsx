import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureDeliveryProps = {
	state: FeatureState;
};

/**
 * Where the feature comes from, and what switching it on will actually do.
 *
 * Turning a feature on can install a whole plugin, which is worth saying before
 * someone clicks rather than after.
 *
 * @param {FeatureDeliveryProps} props       - The component props.
 * @param {FeatureState}         props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureDelivery( { state }: FeatureDeliveryProps ) {
	const { feature } = state;
	const { in_jetpack: inJetpack, standalone } = feature.delivery ?? {};

	if ( ! inJetpack && ! standalone && ! feature.paid_routes?.length ) {
		return null;
	}

	const consequence = () => {
		if ( state.action === 'install' && standalone ) {
			return sprintf(
				/* translators: %s is a plugin name, such as "Jetpack Protect". */
				__( 'Turning it on here installs and activates %s for you.', 'jetpack-my-jetpack' ),
				standalone
			);
		}

		if ( state.action === 'activate' && standalone ) {
			return sprintf(
				/* translators: %s is a plugin name, such as "Jetpack Protect". */
				__( 'Turning it on here activates %s for you.', 'jetpack-my-jetpack' ),
				standalone
			);
		}

		// Carried by a plugin that is already here, so there is nothing to install.
		if ( state.action === 'install' || state.action === 'activate' ) {
			return __( 'Turning it on here switches it on straight away.', 'jetpack-my-jetpack' );
		}

		return '';
	};

	const note = consequence();

	return (
		<div className={ styles[ 'detail-highlights' ] }>
			<Text variant="heading-md">{ __( 'How to get it', 'jetpack-my-jetpack' ) }</Text>
			<Stack direction="column" gap="sm">
				{ inJetpack ? (
					<Text variant="body-md">
						{ __( 'Included in the Jetpack plugin.', 'jetpack-my-jetpack' ) }
					</Text>
				) : null }
				{ standalone ? (
					<Text variant="body-md">
						{ inJetpack
							? sprintf(
									/* translators: %s is a plugin name, such as "Jetpack Protect". */
									__( 'Also available on its own, as the %s plugin.', 'jetpack-my-jetpack' ),
									standalone
							  )
							: sprintf(
									/* translators: %s is a plugin name, such as "Jetpack Protect". */
									__( 'Provided by the %s plugin.', 'jetpack-my-jetpack' ),
									standalone
							  ) }
					</Text>
				) : null }
				{ note ? <Text variant="body-md">{ note }</Text> : null }
				{ feature.paid_routes?.length ? (
					<Stack direction="column" gap="xs">
						<Text variant="body-md">
							{ __( 'Paid features come with:', 'jetpack-my-jetpack' ) }
						</Text>
						{ feature.paid_routes.map( route => (
							<Text key={ route } variant="body-md">
								{ route }
							</Text>
						) ) }
					</Stack>
				) : null }
			</Stack>
		</div>
	);
}
