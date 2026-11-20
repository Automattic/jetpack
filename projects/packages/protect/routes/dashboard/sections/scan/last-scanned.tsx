import { dateI18n, humanTimeDiff } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import useRerenderEvery from '../../components/use-rerender-every';
import { parseLastChecked } from './store';

/**
 * A badge saying when the site was last scanned, such as "Last scan 2 hours ago", with the exact time on hover.
 *
 * @param props             - Component props.
 * @param props.lastChecked - The last scan, in UTC as `YYYY-MM-DD HH:MM:SS`.
 * @return The badge, or nothing when the site hasn't been scanned.
 */
export default function LastScanned( { lastChecked }: { lastChecked?: string | null } ) {
	const date = parseLastChecked( lastChecked );
	useRerenderEvery( 30000, !! date );

	if ( ! date ) {
		return null;
	}

	return (
		<Badge
			intent="draft"
			render={ <time dateTime={ date.toISOString() } title={ dateI18n( 'M j, Y g:i A', date ) } /> }
		>
			{ sprintf(
				/* translators: %s is how long ago, such as "2 hours ago". */
				__( 'Last scan %s', 'jetpack-protect-pkg' ),
				humanTimeDiff( date )
			) }
		</Badge>
	);
}
