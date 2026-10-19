import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getProtectSettingsUrl } from './protect-page';

const PointerCard = ( { header, href, linkText, children } ) => (
	<SettingsCard header={ header } hideButton>
		<SettingsGroup>{ children }</SettingsGroup>
		<Card compact className="jp-settings-card__configure-link" href={ href }>
			{ linkText }
		</Card>
	</SettingsCard>
);

/**
 * Search results that send Security tab settings to the pages that now hold them.
 *
 * @param {object}  props               - Component props.
 * @param {string}  props.siteAdminUrl  - The site's wp-admin URL.
 * @param {boolean} props.showProtect   - Whether the search matched a setting on the Protect page.
 * @param {boolean} props.showBackup    - Whether the search matched Backup.
 * @param {boolean} props.hasBackupPage - Whether the Backup page exists; otherwise point to My Jetpack.
 * @param {boolean} props.showAntispam  - Whether the search matched Akismet, which is active.
 * @return {import('react').ReactNode} The cards.
 */
export function MovedSettings( {
	siteAdminUrl,
	showProtect,
	showBackup,
	hasBackupPage,
	showAntispam,
} ) {
	return (
		<div>
			<h2 className="jp-settings__section-title">{ __( 'Security', 'jetpack' ) }</h2>
			{ showProtect && (
				<PointerCard
					header={ __( 'Security settings', 'jetpack' ) }
					href={ getProtectSettingsUrl( siteAdminUrl ) }
					linkText={ __( 'Open Protect settings', 'jetpack' ) }
				>
					{ __(
						'Firewall, login protection, account protection, downtime monitoring, and WordPress.com login are set up on the Protect page.',
						'jetpack'
					) }
				</PointerCard>
			) }
			{ showBackup &&
				( hasBackupPage ? (
					<PointerCard
						header={ _x( 'Jetpack Backup', 'Settings header', 'jetpack' ) }
						href={ `${ siteAdminUrl }admin.php?page=jetpack-backup` }
						linkText={ __( 'Open Backup', 'jetpack' ) }
					>
						{ __( 'Your backups and restores are on the Backup page.', 'jetpack' ) }
					</PointerCard>
				) : (
					<PointerCard
						header={ _x( 'Jetpack Backup', 'Settings header', 'jetpack' ) }
						href={ `${ siteAdminUrl }admin.php?page=my-jetpack#/add-backup` }
						linkText={ __( 'Set up Backup', 'jetpack' ) }
					>
						{ __(
							'Jetpack Backup saves your site as you edit it, so you can restore it in one click.',
							'jetpack'
						) }
					</PointerCard>
				) ) }
			{ showAntispam && (
				<PointerCard
					header={ _x( 'Anti-spam', 'Settings header', 'jetpack' ) }
					href={ `${ siteAdminUrl }admin.php?page=akismet-key-config` }
					linkText={ __( 'Open Akismet Anti-spam', 'jetpack' ) }
				>
					{ __(
						'Akismet’s settings, including your API key, are on the Akismet Anti-spam page.',
						'jetpack'
					) }
				</PointerCard>
			) }
		</div>
	);
}
