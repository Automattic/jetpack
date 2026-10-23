import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, offline } from '@wordpress/icons';
import { Card, Link, Text } from '@wordpress/ui';

/**
 * Fallback shown while Jetpack is in offline mode.
 *
 * @return The rendered fallback.
 */
export default function OfflineModeScreen() {
	return (
		<div className="jpb-gates__stage">
			<Card.Root className="jpb-gates__card">
				<span className="jpb-gates__badge" aria-hidden="true">
					<Icon icon={ offline } />
				</span>
				<Text variant="body-xl" className="jpb-gates__title" render={ <h2 /> }>
					{ __( 'Backup is unavailable in Offline Mode', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ createInterpolateElement(
						__(
							"Jetpack is in Offline Mode on this site, so backups can't be viewed or restored here. If this site is a copy of a live site, manage its backups from the live site. <a>Learn about Offline Mode</a>",
							'jetpack-backup-pkg'
						),
						{
							a: (
								<Link openInNewTab href={ getRedirectUrl( 'jetpack-support-development-mode' ) } />
							),
						}
					) }
				</Text>
			</Card.Root>
		</div>
	);
}
