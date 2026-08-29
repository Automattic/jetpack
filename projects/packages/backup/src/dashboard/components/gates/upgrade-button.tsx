import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSiteSuffix } from '../../hooks/use-connection';

/**
 * The way in for someone who has not bought Backup yet.
 *
 * Only the no-plan gate renders this, and that is a constraint rather
 * than an accident: checkout needs a linked WordPress.com connection, so
 * this button belongs only on a screen whose reader has one. The
 * secondary-admin gate deliberately does not use it — see the note there.
 *
 * The destination is the redirect service, with the same slug the legacy
 * no-plan card used rather than a jetpack.com URL written here — that
 * slug's target is maintained outside this repo, so reusing it keeps this
 * screen pointing wherever that one already points.
 *
 * Same tab, as legacy did. An upgrade flow that opens a new one strands
 * the page the reader started from, and returns them to a dashboard that
 * still says they have no plan.
 *
 * The label is legacy's, which this package still ships in three other
 * places — so it arrives translated rather than waiting a GlotPress
 * cycle.
 *
 * No Tracks event on the CTA yet: there is no Tracks client on the
 * modernized page at all — `enqueue_admin_scripts()` returns before
 * registering one — so legacy's `jetpack_backup_plugin_upgrade_click`
 * has nowhere to go until that lands. Wiring it is H1b's job.
 *
 * @return The rendered button.
 */
export default function UpgradeButton() {
	const site = useSiteSuffix();
	// The key is omitted rather than passed as undefined. `getRedirectUrl`
	// walks its args with `for…in`, so a present-but-undefined `site` is
	// encoded — the link would carry the literal string `undefined` — and
	// its mere presence also suppresses the helper's own site fallback.
	// Passing nothing is the only way this degrades cleanly.
	const upgradeUrl = getRedirectUrl( 'backup-plugin-upgrade-10gb', site ? { site } : {} );

	return (
		<Button variant="primary" href={ upgradeUrl }>
			{ __( 'Get VaultPress Backup', 'jetpack-backup-pkg' ) }
		</Button>
	);
}
