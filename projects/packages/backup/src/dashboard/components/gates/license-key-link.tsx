import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Where a license key is redeemed. My Jetpack owns redemption for the
 * standalone plugins; Backup has no redemption UI of its own.
 *
 * Relative on purpose: the legacy header built this from the connection
 * store's `adminUrl`, which comes from `JPBACKUP_INITIAL_STATE` — and
 * the modernized page deliberately does not emit that. This only ever
 * renders from `admin.php`, so the browser resolves a relative path
 * against the same directory the absolute form would have produced.
 */
const ADD_LICENSE_URL = 'admin.php?page=my-jetpack#/add-license';

/**
 * The way in for someone who has already bought Backup.
 *
 * The label is the one this package's legacy header already ships, so it
 * arrives translated and matches the phrase on the My Jetpack screen the
 * reader is about to land on.
 *
 * Legacy showed this only where `<AdminPage>` rendered a header, which
 * excluded the secondary-admin path. Showing it on all three screens is
 * a deliberate widening: someone who bought a license and hit a "link
 * your account" wall is exactly who needs it.
 *
 * @return The rendered link.
 */
export default function LicenseKeyLink() {
	return (
		<Button variant="link" href={ ADD_LICENSE_URL }>
			{ __( 'Use license key', 'jetpack-backup-pkg' ) }
		</Button>
	);
}
