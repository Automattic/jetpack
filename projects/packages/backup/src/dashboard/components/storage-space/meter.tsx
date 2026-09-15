import { ProgressBar } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';

/**
 * Level → fill colour.
 *
 * Colour only. Geometry is a separate modifier keyed off how full the bar
 * actually is, because the two do not travel together: `BackupsDiscarded`
 * is the one level derived from the retention day-counts rather than the
 * percentage, so it fires at any fill level while carrying the same alarm
 * colour as `Full`. Folding the two into one modifier drew it as a
 * fully-rounded pill floating in the track at 50% — the exact shape the
 * partly-filled treatment exists to avoid.
 *
 * `Critical`, `Full` and `BackupsDiscarded` share the error fill
 * deliberately: the reader needs one alarm, not three shades of one.
 */
// Spelled as literal keys rather than `[ StorageUsageLevels.Normal ]`:
// the members of that object are typed as the whole union, so a computed
// key from it widens and the record stops being exhaustive — which is the
// one thing this table is for.
const FILL_MODIFIERS: Record< StorageUsageLevelName, string > = {
	Normal: 'neutral',
	Warning: 'caution',
	Critical: 'error',
	Full: 'error',
	BackupsDiscarded: 'error',
};

type Props = {
	storageUsed: number;
	storageLimit: number;
	usageLevel: StorageUsageLevelName | null;
};

/**
 * The storage usage bar.
 *
 * A presentational shell around `<ProgressBar>`: the caller has already
 * decided there are figures worth drawing, and the level has already been
 * derived. Percentages above 100 are clamped, because a site can hold
 * more than its limit and a bar cannot be more than full.
 *
 * @param props              - Component props.
 * @param props.storageUsed  - Bytes of backup storage in use.
 * @param props.storageLimit - The plan's storage limit in bytes. Must be greater than zero.
 * @param props.usageLevel   - Derived level, or null when it could not be computed.
 * @return The rendered meter.
 */
export default function StorageMeter( { storageUsed, storageLimit, usageLevel }: Props ) {
	const percent = Math.min( ( storageUsed / storageLimit ) * 100, 100 );
	// Fall back to the calm styling rather than an unstyled bar when the
	// level is unknown: the figures are still real, only the judgement
	// about them is missing.
	const fill = FILL_MODIFIERS[ usageLevel ?? StorageUsageLevels.Normal ];
	// Only a bar that actually reaches the end may take the track's own
	// rounding on both ends and give up the trailing-edge buffer. Driven
	// by the measurement, never by the level name.
	const classNames = [ 'jpb-storage-meter__bar', `jpb-storage-meter__bar--${ fill }` ];
	if ( percent >= 100 ) {
		classNames.push( 'jpb-storage-meter__bar--complete' );
	}

	return (
		<div className="jpb-storage-meter">
			{ /*
			 * Named because nothing else on the card is associated with the
			 * bar; the legacy dashboard's meter still announces itself as a
			 * loading indicator. See `tests/progress-bar-names.test.tsx`.
			 */ }
			<ProgressBar
				className={ classNames.join( ' ' ) }
				value={ percent }
				aria-label={ sprintf(
					/* translators: %d: percentage of backup storage used. */
					__( 'Backup storage used: %d%%', 'jetpack-backup-pkg' ),
					Math.round( percent )
				) }
			/>
		</div>
	);
}
