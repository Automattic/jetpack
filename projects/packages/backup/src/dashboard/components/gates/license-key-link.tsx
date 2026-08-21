import { __ } from '@wordpress/i18n';

/**
 * Where a license key is redeemed.
 *
 * Relative on purpose. The legacy header built this from the connection
 * store's `adminUrl` (`src/js/components/Admin/index.jsx:66-69`), but
 * that store is populated from `JPBACKUP_INITIAL_STATE`, which the
 * modernized page deliberately does not emit — `enqueue_admin_scripts()`
 * returns before it. A relative path needs none of that: this only ever
 * renders from `admin.php`, so the browser resolves it against the same
 * directory the absolute form would have produced.
 *
 * My Jetpack owns license redemption for the standalone plugins; Backup
 * has no redemption UI of its own to link to.
 */
const ADD_LICENSE_URL = 'admin.php?page=my-jetpack#/add-license';

/**
 * The way in for someone who has already bought Backup.
 *
 * Legacy showed this whenever the site was not fully connected *or* was
 * connected without a plan (`useShowActivateLicenseLink`,
 * `src/js/components/Admin/index.jsx:436-457`), which is every screen
 * this gate layer can render — so all three of them carry it rather than
 * only the upgrade screen. Someone who bought a license and arrived at a
 * connection prompt is exactly the person who needs it.
 *
 * @return The rendered link.
 */
export default function LicenseKeyLink() {
	return (
		<a className="jpb-gates__license-link" href={ ADD_LICENSE_URL }>
			{ __( 'Already have a license key?', 'jetpack-backup-pkg' ) }
		</a>
	);
}
