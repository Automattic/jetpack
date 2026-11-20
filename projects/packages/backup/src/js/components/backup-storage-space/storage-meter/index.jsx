import { __, sprintf } from '@wordpress/i18n';
import { Progress } from '@wordpress/ui';
import { StorageUsageLevels } from '../storage-usage-levels';
import './style.scss';

const STORAGE_METER_CLASS_NAMES = {
	[ StorageUsageLevels.Full ]: 'full-warning',
	[ StorageUsageLevels.Critical ]: 'red-warning',
	[ StorageUsageLevels.Warning ]: 'yellow-warning',
	[ StorageUsageLevels.Normal ]: 'no-warning',
	[ StorageUsageLevels.BackupsDiscarded ]: 'full-warning',
};

const StorageMeter = ( { storageUsed, storageLimit, usageLevel } ) => {
	const progress = ( storageUsed ?? 0 ) / ( storageLimit ?? Infinity );
	const percent = Math.min( progress * 100, 100 );
	const classNames = [
		'backup-storage-space__progress-bar',
		STORAGE_METER_CLASS_NAMES[ usageLevel ],
	];

	return (
		<Progress.Root
			className={ classNames.filter( Boolean ).join( ' ' ) }
			value={ percent }
			aria-label={ sprintf(
				/* translators: %d: percentage of backup storage used. */
				__( 'Backup storage used: %d%%', 'jetpack-backup-pkg' ),
				Math.round( percent )
			) }
		>
			<Progress.Track className="backup-storage-space__progress-track">
				<Progress.Indicator className="backup-storage-space__progress-indicator" />
			</Progress.Track>
		</Progress.Root>
	);
};

export default StorageMeter;
