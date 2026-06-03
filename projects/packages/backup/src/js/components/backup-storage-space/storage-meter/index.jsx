import { ProgressBar } from '@wordpress/components';
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
	return (
		<div className="backup-storage-space__progress-bar">
			<ProgressBar
				className={ STORAGE_METER_CLASS_NAMES[ usageLevel ] }
				value={ Math.min( progress * 100, 100 ) }
			/>
		</div>
	);
};

export default StorageMeter;
