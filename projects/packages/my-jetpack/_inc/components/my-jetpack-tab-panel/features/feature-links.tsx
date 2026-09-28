import { __ } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
import styles from './styles.module.scss';

type FeatureLinksProps = {
	feature: MainFeature;
};

/**
 * Links to the feature's own page and its documentation.
 *
 * Renders only the links a feature actually has: Podcast, for one, has support docs
 * but no marketing page.
 *
 * @param {FeatureLinksProps} props         - The component props.
 * @param {MainFeature}       props.feature - The feature to link to.
 * @return The rendered component.
 */
export function FeatureLinks( { feature }: FeatureLinksProps ) {
	if ( ! feature.info_url && ! feature.docs_url ) {
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
		</Stack>
	);
}
