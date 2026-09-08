import { __ } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
import styles from './styles.module.scss';

type FeatureLinksProps = {
	feature: MainFeature;
	isActive: boolean;
};

/**
 * Links to the feature's own page, its documentation, and its settings.
 *
 * Renders only the links a feature actually has: Podcast, for one, has support docs
 * but no marketing page, and most features keep their settings on the page they
 * already link to, so they offer no settings link at all.
 *
 * @param {FeatureLinksProps} props          - The component props.
 * @param {MainFeature}       props.feature  - The feature to link to.
 * @param {boolean}           props.isActive - Whether the feature is running.
 * @return The rendered component.
 */
export function FeatureLinks( { feature, isActive }: FeatureLinksProps ) {
	// An inactive feature has no settings to configure yet.
	const settingsUrl = isActive ? feature.settings_url : '';

	if ( ! feature.info_url && ! feature.docs_url && ! settingsUrl ) {
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
			{ settingsUrl ? (
				<Link href={ settingsUrl }>{ __( 'Settings', 'jetpack-my-jetpack' ) }</Link>
			) : null }
		</Stack>
	);
}
