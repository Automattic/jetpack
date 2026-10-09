import { __ } from '@wordpress/i18n';
import { Icon, plugins } from '@wordpress/icons';
import { Card, LinkButton, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/**
 * My Jetpack's account-link screen, for the reasons in `not-connected.tsx`.
 * Deep-linked past the landing page, and `skip_pricing` because the no-plan gate
 * already sells to the readers who need it.
 */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack#/connection?skip_pricing=true';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * This screen cannot know whether the site has a Backup plan — the gate reaches
 * it from connection state alone — so every claim leads with its condition. No
 * purchase button either: checkout needs a linked connection, and linking is the
 * way forward for both readers.
 *
 * @return The rendered fallback.
 */
export default function SecondaryAdminScreen() {
	return (
		<div className="jpb-gates__stage">
			<Card.Root className="jpb-gates__card">
				<span className="jpb-gates__badge" aria-hidden="true">
					<Icon icon={ plugins } />
				</span>
				<Text variant="body-xl" className="jpb-gates__title" render={ <h2 /> }>
					{ __( 'Link your WordPress.com account', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						"This site's Jetpack connection is already set up, but your account isn't linked to a WordPress.com user yet.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Text className="jpb-gates__paragraph">
					{ __(
						"Once your account is linked, you'll see any backups this site has. If it doesn't have an active Backup plan yet, you'll be able to add VaultPress Backup to start protecting it.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<div className="jpb-gates__actions">
					<LinkButton variant="solid" tone="brand" href={ JETPACK_CONNECT_USER_URL }>
						{ __( 'Link my account', 'jetpack-backup-pkg' ) }
					</LinkButton>
					<LicenseKeyLink />
				</div>
			</Card.Root>
		</div>
	);
}
