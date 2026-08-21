import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import LicenseKeyLink from './license-key-link';

/**
 * Fallback shown when the site is fully connected but has no active
 * Backup plan.
 *
 * This is the whole purchase path for a site without Backup, so it
 * carries both ways in: buy one, or redeem one already bought.
 *
 * The destination is the redirect service with the same slug the legacy
 * no-plan card used (`src/js/components/Admin/no-backup-capabilities.jsx:34`)
 * rather than a jetpack.com URL written here — the slug's target is
 * maintained outside this repo, and reusing it keeps this screen pointing
 * wherever that one already points. It is scoped to the site, without
 * which checkout has no idea which site the reader came from.
 *
 * No Tracks event on the CTA yet: there is no Tracks client on the
 * modernized page at all — `enqueue_admin_scripts()` returns before
 * registering one — so legacy's `jetpack_backup_plugin_upgrade_click`
 * has nowhere to go until that lands. Wiring it is H1b's job.
 *
 * @return The rendered fallback.
 */
export default function NoBackupPlanScreen() {
	const site = useSiteSuffix();
	// `getRedirectUrl` omits the query arg entirely for an undefined
	// site, so an unscoped link degrades rather than breaking.
	const upgradeUrl = getRedirectUrl( 'backup-plugin-upgrade-10gb', { site } );

	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( "This site doesn't have an active Backup plan", 'jetpack-backup-pkg' ) }
				</Text>
				<Notice status="info" isDismissible={ false }>
					{ __(
						'Add Jetpack Backup to start protecting your site with automatic backups, granular restores, and offsite storage.',
						'jetpack-backup-pkg'
					) }
				</Notice>
				{ /*
				 * Same tab, as legacy did. An upgrade flow that opens a new
				 * one strands the page the reader started from, and returns
				 * them to a dashboard that still says they have no plan.
				 */ }
				<a className="jpb-gates__cta" href={ upgradeUrl }>
					{ __( 'Upgrade now', 'jetpack-backup-pkg' ) }
				</a>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
