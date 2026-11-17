import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, VisuallyHidden } from '@wordpress/ui';

/**
 * The "Known threats (N)" badge.
 *
 * @param props       - Component props.
 * @param props.count - Number of malware and database threats in the backup.
 * @return The badge.
 */
export function KnownThreatsBadge( { count }: { count: number } ) {
	return (
		<Badge intent="medium">
			{ sprintf(
				/* translators: %d: number of known security threats in a backup. */
				__( 'Known threats (%d)', 'jetpack-backup-pkg' ),
				count
			) }
		</Badge>
	);
}

/**
 * The badge where the warning itself isn't shown, followed by the warning for screen readers.
 *
 * @param props       - Component props.
 * @param props.count - Number of malware and database threats in the backup.
 * @return The badge.
 */
export function KnownThreatsBadgeWithWarning( { count }: { count: number } ) {
	return (
		<>
			<KnownThreatsBadge count={ count } />
			<VisuallyHidden render={ <span /> }>
				{ sprintf(
					/* translators: %d: number of known security threats in the backup. */
					_n(
						'This backup is known to contain %d security threat. Restoring it may bring malware back to your site.',
						'This backup is known to contain %d security threats. Restoring it may bring malware back to your site.',
						count,
						'jetpack-backup-pkg'
					),
					count
				) }
			</VisuallyHidden>
		</>
	);
}
