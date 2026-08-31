import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSiteSuffix } from '../../hooks/use-connection';

/**
 * The way in for someone who has not bought Backup yet.
 *
 * Only the no-plan gate renders this: checkout needs a linked
 * WordPress.com connection, so the secondary-admin gate deliberately does
 * not — see the note there.
 *
 * Reuses legacy's redirect slug and label rather than a URL and string
 * written here, so the destination stays maintained outside this repo and
 * the label arrives already translated. Same tab, as legacy did: an
 * upgrade flow that opens a new one strands the page it started from.
 *
 * No Tracks event yet — the modernized page registers no Tracks client at
 * all, so legacy's `jetpack_backup_plugin_upgrade_click` has nowhere to
 * go until H1b lands one.
 *
 * @return The rendered button.
 */
export default function UpgradeButton() {
	const site = useSiteSuffix();
	// The key is omitted rather than passed as undefined: `getRedirectUrl`
	// walks its args with `for…in`, so a present-but-undefined `site` is
	// encoded literally *and* suppresses the helper's own site fallback.
	const upgradeUrl = getRedirectUrl( 'backup-plugin-upgrade-10gb', site ? { site } : {} );

	return (
		<Button variant="primary" href={ upgradeUrl }>
			{ __( 'Get VaultPress Backup', 'jetpack-backup-pkg' ) }
		</Button>
	);
}
