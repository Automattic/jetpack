import { ProgressBar } from '@automattic/jetpack-components';
import { StorageUsageLevels } from '../storage-usage-levels';
import './style.scss';

const StorageMeter = ( { storageUsed, storageLimit, usageLevel } ) => {
	const STORAGE_METER_CLASS_NAMES = {
		[ StorageUsageLevels.Full ]: 'full-warning',
		[ StorageUsageLevels.Critical ]: 'red-warning',
		[ StorageUsageLevels.Warning ]: 'yellow-warning',
		[ StorageUsageLevels.Normal ]: 'no-warning',
		[ StorageUsageLevels.BackupsDiscarded ]: 'full-warning',
	};
	return (
		<>
			<div className="backup-storage-space__progress-bar">
				<ProgressBar
					className={ [ 'progress-bar', STORAGE_METER_CLASS_NAMES[ usageLevel ] ] }
					progressClassName={ 'progress-bar__progress' }
					progress={ ( storageUsed ?? 0 ) / ( storageLimit ?? Infinity ) }
				/>
			</div>
		</>
	);
};

export default StorageMeter;
