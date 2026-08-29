import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/** My Jetpack, for the reasons spelled out in `not-connected.tsx`. */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * This screen cannot know whether the site has a Backup plan: the gate
 * reaches it from connection state alone, and the capabilities bridge
 * would answer 403 without a user connection, so there is nothing to ask.
 * That makes it the one gate that has to be right for both readers, so
 * every claim here is conditional: the condition leads, because a flat
 * "you'll see this site's backups" is false on a plan-less site and a
 * later "if it has a plan" does not retract it.
 *
 * No purchase button, deliberately, even though some readers here do need
 * a plan. Checkout requires a linked connection, so a "Get VaultPress
 * Backup" button on this screen would hand this particular reader a flow
 * they cannot finish — the same broken promise the copy above was fixed
 * to stop making, moved into a button.
 *
 * Linking is the way forward for both readers, which is why it is the
 * only action. It is what an entitled reader needs, and it is also the
 * first step for an unentitled one: once linked, a plan-less site lands
 * on the no-plan gate, which carries a working upsell for someone who
 * can now complete it. The copy names the plan in that order — link
 * first, then buy — rather than offering a shortcut that dead-ends.
 *
 * @return The rendered fallback.
 */
export default function SecondaryAdminScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h2 /> }>
					{ __( 'Link your WordPress.com account', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						"This site's Jetpack connection is already set up, but your account isn't linked to a WordPress.com user yet.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Text>
					{ __(
						"Once your account is linked, you'll see any backups this site has. If it doesn't have an active Backup plan yet, you can add VaultPress Backup to start protecting it.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="primary" href={ JETPACK_CONNECT_USER_URL }>
					{ __( 'Link my account', 'jetpack-backup-pkg' ) }
				</Button>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
