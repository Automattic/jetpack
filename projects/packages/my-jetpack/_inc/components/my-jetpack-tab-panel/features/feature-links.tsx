import { __ } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
import styles from './styles.module.scss';

type FeatureLinksProps = {
	feature: MainFeature;
};

/**
 * Links to the feature's own page, its documentation, and its settings.
 *
 * Renders only the links a feature actually has: Podcast, for one, has support docs
 * but no marketing page, and most features keep their settings on the page they
 * already link to.
 *
 * @param {FeatureLinksProps} props         - The component props.
 * @param {MainFeature}       props.feature - The feature to link to.
 * @return The rendered component.
 */
export function FeatureLinks( { feature }: FeatureLinksProps ) {
	if ( ! feature.info_url && ! feature.docs_url && ! feature.settings_url ) {
		return null;
	}

	return (
		<Stack
			direction="row"
			align="center"
			gap="lg"
			wrap="wrap"
			className={ styles[ 'detail-links' ] }
		>
			{ feature.info_url ? (
				<Link href={ feature.info_url } openInNewTab>
					{ __( 'Feature page', 'jetpack-my-jetpack' ) }
				</Link>
			) : null }
			{ feature.docs_url ? (
				<Link href={ feature.docs_url } openInNewTab>
					{ __( 'Documentation', 'jetpack-my-jetpack' ) }
				</Link>
			) : null }
			{ /* Settings stay in wp-admin, so this one is not a new tab. */ }
			{ feature.settings_url ? (
				<Link href={ feature.settings_url }>{ __( 'Settings', 'jetpack-my-jetpack' ) }</Link>
			) : null }
		</Stack>
	);
}
