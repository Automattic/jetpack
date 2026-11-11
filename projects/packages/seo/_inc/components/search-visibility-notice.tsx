import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { getPreloaded, OVERVIEW_PATH, SETTINGS_PATH } from '../data/get-preloaded';
import { settingsStore } from '../data/settings-store';
import type { OverviewResponse } from '../data/overview-types';
import type { SettingsResponse } from '../data/settings-types';

/**
 * Show the site-wide indexing restriction above SEO controls.
 *
 * @return The warning when indexing is restricted, otherwise null.
 */
export default function SearchVisibilityNotice() {
	const saved = useSelect( select => select( settingsStore ).getSettings(), [] );
	const settings =
		saved ??
		getPreloaded< SettingsResponse >( SETTINGS_PATH ) ??
		getPreloaded< OverviewResponse >( OVERVIEW_PATH )?.site_visibility;
	if ( settings?.search_engines_visible !== false ) {
		return null;
	}
	const comingSoon = settings && 'site_is_coming_soon' in settings && settings.site_is_coming_soon;
	let message: string = __(
		'Search engines are discouraged from indexing this site.',
		'jetpack-seo'
	);
	if ( comingSoon ) {
		message = __(
			'This site is in Coming Soon mode, so search engines cannot access its content yet.',
			'jetpack-seo'
		);
	} else if ( settings.site_is_private ) {
		message = __(
			'This site is not public, so search engines cannot access its content.',
			'jetpack-seo'
		);
	}
	const settingsUrl =
		settings && 'site_visibility_url' in settings ? settings.site_visibility_url : undefined;
	return (
		<Notice.Root intent="warning" className="jetpack-seo-visibility-notice">
			<Notice.Description>{ message }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href={ settingsUrl || getAdminUrl( 'options-reading.php' ) }>
					{ __( 'Review site visibility settings', 'jetpack-seo' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
