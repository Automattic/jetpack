import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_SEARCH_JETPACK } from 'lib/plans/constants';
import { isOfflineMode } from 'state/connection';

const SEARCH_DESCRIPTION = __(
	'Jetpack Search helps your visitors instantly find the right content. Choose how Search appears on your site — as an embedded results page, an overlay, or in place of your theme’s default search.',
	'jetpack'
);
const SEARCH_DASHBOARD_CTA = __( 'Manage Search settings', 'jetpack' );
const SEARCH_SUPPORT = __( 'Search supports many customizations.', 'jetpack' );

/**
 * Search settings entry for the Performance section. The actual experience
 * picker and per-experience configuration live on the Search dashboard, so
 * this section is intentionally a short intro plus a link there.
 *
 * @param {object} props - Component properties.
 * @return {import('react').Component} Search settings component.
 */
function Search( props ) {
	return (
		<SettingsCard { ...props } module="search" feature={ FEATURE_SEARCH_JETPACK } hideButton>
			<SettingsGroup
				disableInOfflineMode
				module={ { module: 'search' } }
				support={ {
					text: SEARCH_SUPPORT,
					link: getRedirectUrl( 'jetpack-support-search' ),
				} }
			>
				<p>
					{ props.inOfflineMode
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: SEARCH_DESCRIPTION }
				</p>
			</SettingsGroup>
			{ ! props.inOfflineMode && (
				<Card
					compact
					className="jp-settings-card__configure-link"
					href="admin.php?page=jetpack-search#/settings"
				>
					{ SEARCH_DASHBOARD_CTA }
				</Card>
			) }
		</SettingsCard>
	);
}

export default connect( state => ( {
	inOfflineMode: isOfflineMode( state ),
} ) )( withModuleSettingsFormHelpers( Search ) );
