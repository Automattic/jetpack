import './style.scss';
import { useStorageUsageText } from './use-storage-usage-text';

const StorageUsageDetails = ( { storageUsed, storageLimit } ) => {
	const usageText = useStorageUsageText( storageUsed, storageLimit );

	return (
		<>
			<div className="backup-storage-space__meta">
				<div className="backup-storage-space__usage-text">{ usageText }</div>
				<div className="backup-storage-space__retention">{ /* X days of backups saved */ }</div>
			</div>
		</>
	);
};

export default StorageUsageDetails;
