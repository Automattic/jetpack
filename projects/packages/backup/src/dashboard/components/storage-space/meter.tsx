import { ProgressBar } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';

/**
 * Level → BEM modifier. `BackupsDiscarded` deliberately shares `full`:
 * both mean storage has already cost the site backups, and the reader
 * needs one alarm, not two shades of one.
 */
// Spelled as literal keys rather than `[ StorageUsageLevels.Normal ]`:
// the members of that object are typed as the whole union, so a computed
// key from it widens and the record stops being exhaustive — which is the
// one thing this table is for.
const METER_MODIFIERS: Record< StorageUsageLevelName, string > = {
	Normal: 'normal',
	Warning: 'warning',
	Critical: 'critical',
	Full: 'full',
	BackupsDiscarded: 'full',
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
	const modifier = METER_MODIFIERS[ usageLevel ?? StorageUsageLevels.Normal ];

	return (
		<div className="jpb-storage-meter">
			{ /*
			 * `<ProgressBar>` hardcodes `aria-label="Loading …"` but
			 * spreads the caller's props after it, so this replaces it.
			 * Without the override a screen reader announces the storage
			 * meter as a loading indicator — which is what the legacy
			 * dashboard's bar does today.
			 */ }
			<ProgressBar
				className={ `jpb-storage-meter__bar jpb-storage-meter__bar--${ modifier }` }
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
