import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSiteSuffix } from '../../hooks/use-connection';

/**
 * The way in for someone who has not bought Backup yet.
 *
 * Only the no-plan gate renders this: checkout needs a linked WordPress.com
 * connection, which the secondary-admin gate cannot assume. Reuses legacy's
 * redirect slug and label, so the destination stays maintained outside this repo
 * and the label arrives already translated.
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
