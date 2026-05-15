import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

const JETPACK_CONNECT_USER_URL = 'admin.php?page=jetpack#/connection';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * Links out to the Jetpack settings connection screen rather than
 * embedding `<ConnectButton>` (see `not-connected.tsx` for the
 * wp-build/SCSS rationale).
 *
 * @return The rendered fallback.
 */
export default function SecondaryAdminScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Link your account to view backups', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						"This site's Jetpack connection is already set up, but your account isn't linked to a WordPress.com user yet.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="primary" href={ JETPACK_CONNECT_USER_URL }>
					{ __( 'Link my account', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		</Card>
	);
}
