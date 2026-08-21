import { Button } from '@wordpress/components';
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
 * The label is the one five other Jetpack products already ship, and
 * which this package itself still ships from the legacy header
 * (`src/js/components/Admin/index.jsx:82`) — so it arrives translated in
 * every locale rather than waiting a GlotPress cycle, and it matches the
 * phrase on the My Jetpack screen the reader is about to land on.
 *
 * Where it appears is a small, deliberate widening rather than parity.
 * Legacy's `useShowActivateLicenseLink` returned true both when the site
 * was not fully connected and when it was connected without a plan — but
 * it only fed `headerActions`, and the secondary-admin path renders
 * `<AdminPage showHeader={ false }>` (`index.jsx:429`), so the link was
 * hidden there. It is shown on all three screens now: someone who bought
 * a license and hit a "link your account" wall is exactly who needs it.
 *
 * @return The rendered link.
 */
export default function LicenseKeyLink() {
	// `variant="link"` rather than a bare anchor: it brings the focus
	// ring, hover treatment and type scale that the hand-rolled
	// `jpb-gates__cta` next to it reimplements in SCSS. Rendered with an
	// `href`, so it is still an `<a>` and still has the link role.
	return (
		<Button variant="link" href={ ADD_LICENSE_URL }>
			{ __( 'Use license key', 'jetpack-backup-pkg' ) }
		</Button>
	);
}
