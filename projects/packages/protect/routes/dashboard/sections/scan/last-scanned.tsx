import { dateI18n, humanTimeDiff } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import useRerenderEvery from '../../components/use-rerender-every';
import { parseLastChecked } from './store';

/**
 * When the site was last scanned, as how long ago and the exact time, kept current every 30 seconds.
 *
 * @param lastChecked - The last scan, in UTC as `YYYY-MM-DD HH:MM:SS`.
 * @return The date, how long ago it was (such as "2 hours ago"), and the exact time; null when the site hasn't been scanned.
 */
export function useLastScannedTime(
	lastChecked?: string | null
): { date: Date; ago: string; title: string } | null {
	const date = parseLastChecked( lastChecked );
	useRerenderEvery( 30000, !! date );

	if ( ! date ) {
		return null;
	}
	return { date, ago: humanTimeDiff( date ), title: dateI18n( 'M j, Y g:i A', date ) };
}

/**
 * A badge saying when the site was last scanned, such as "Last scan 2 hours ago", with the exact time on hover.
 *
 * @param props             - Component props.
 * @param props.lastChecked - The last scan, in UTC as `YYYY-MM-DD HH:MM:SS`.
 * @return The badge, or nothing when the site hasn't been scanned.
 */
export default function LastScanned( { lastChecked }: { lastChecked?: string | null } ) {
	const time = useLastScannedTime( lastChecked );

	if ( ! time ) {
		return null;
	}

	return (
		<Badge
			intent="draft"
			render={ <time dateTime={ time.date.toISOString() } title={ time.title } /> }
		>
			{ sprintf(
				/* translators: %s is how long ago, such as "2 hours ago". */
				__( 'Last scan %s', 'jetpack-protect-pkg' ),
				time.ago
			) }
		</Badge>
	);
}
