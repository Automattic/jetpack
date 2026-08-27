import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { Button, Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import LicenseKeyLink from './license-key-link';
import PromotedPrice from './promoted-price';

/**
 * Fallback shown when the site is fully connected but has no active
 * Backup plan.
 *
 * This is the whole purchase path for a site without Backup, so it
 * carries both ways in: buy one, or redeem one already bought.
 *
 * The destination is the redirect service, with the same slug the legacy
 * no-plan card used rather than a jetpack.com URL written here — that
 * slug's target is maintained outside this repo, so reusing it keeps
 * this screen pointing wherever that one already points.
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
	// The key is omitted rather than passed as undefined. `getRedirectUrl`
	// walks its args with `for…in`, so a present-but-undefined `site` is
	// encoded — the link would carry the literal string `undefined` — and
	// its mere presence also suppresses the helper's own site fallback.
	// Passing nothing is the only way this degrades cleanly.
	const upgradeUrl = getRedirectUrl( 'backup-plugin-upgrade-10gb', site ? { site } : {} );

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
				<PromotedPrice />
				{ /*
				 * Same tab, as legacy did. An upgrade flow that opens a new
				 * one strands the page the reader started from, and returns
				 * them to a dashboard that still says they have no plan.
				 *
				 * The label is legacy's, which this package still ships in
				 * three other places — so it arrives translated rather than
				 * waiting a GlotPress cycle.
				 */ }
				<Button variant="primary" href={ upgradeUrl }>
					{ __( 'Get VaultPress Backup', 'jetpack-backup-pkg' ) }
				</Button>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
