import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getProtectSettingsUrl } from './protect-page';

/**
 * Search result that sends security settings to the Protect page, which replaces the Security tab.
 *
 * @param {object} props              - Component props.
 * @param {string} props.siteAdminUrl - The site's wp-admin URL.
 * @return {import('react').ReactNode} The card.
 */
export function MovedToProtect( { siteAdminUrl } ) {
	return (
		<div>
			<h2 className="jp-settings__section-title">{ __( 'Security', 'jetpack' ) }</h2>
			<SettingsCard header={ __( 'Security settings', 'jetpack' ) } hideButton>
				<SettingsGroup>
					{ __(
						'Firewall, login protection, account protection, downtime monitoring, and WordPress.com login are set up on the Protect page.',
						'jetpack'
					) }
				</SettingsGroup>
				<Card
					compact
					className="jp-settings-card__configure-link"
					href={ getProtectSettingsUrl( siteAdminUrl ) }
				>
					{ __( 'Open Protect settings', 'jetpack' ) }
				</Card>
			</SettingsCard>
		</div>
	);
}
