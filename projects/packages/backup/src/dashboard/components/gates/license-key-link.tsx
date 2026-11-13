import { __ } from '@wordpress/i18n';
import { ButtonLink } from '@wordpress/ui';

/**
 * Where a license key is redeemed. My Jetpack owns redemption for the
 * standalone plugins; Backup has no redemption UI of its own.
 *
 * Relative: this only renders from `admin.php`.
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
		<ButtonLink
			className="jpb-gates__license"
			variant="minimal"
			tone="brand"
			href={ ADD_LICENSE_URL }
		>
			{ __( 'Use license key', 'jetpack-backup-pkg' ) }
		</ButtonLink>
	);
}
