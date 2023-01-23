import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useConnection from '../../hooks/useConnection';
import { STORE_ID } from '../../store';
import { StorageAddonUpsellPrompt } from './storage-addon-upsell-prompt';
import StorageMeter from './storage-meter';
import StorageUsageDetails from './storage-usage-details';
import { getUsageLevel, StorageUsageLevels } from './storage-usage-levels';

const BackupStorageSpace = () => {
	const [ connectionStatus ] = useConnection();
	const isFetchingPolicies = useSelect( select => select( STORE_ID ).isFetchingBackupPolicies() );
	const isFetchingSize = useSelect( select => select( STORE_ID ).isFetchingBackupSize() );
	const storageLimit = useSelect( select => select( STORE_ID ).getBackupStorageLimit() );
	const storageSize = useSelect( select => select( STORE_ID ).getBackupSize() );
	const showComponent = storageSize !== null && storageLimit > 0;

	const [ usageLevel, setUsageLevel ] = useState( StorageUsageLevels.Normal );
	const dispatch = useDispatch( STORE_ID );

	// Fetch backup policies and site size
	useEffect( () => {
		const connectionLoaded = 0 < Object.keys( connectionStatus ).length;
		if ( ! connectionLoaded ) {
			return;
		}

		if ( ! isFetchingPolicies && ! storageLimit ) {
			dispatch.getSitePolicies();
		}

		if ( ! isFetchingSize && ! storageSize ) {
			dispatch.getSiteSize();
		}
	}, [
		connectionStatus,
		dispatch,
		isFetchingPolicies,
		isFetchingSize,
		storageLimit,
		storageSize,
	] );

	useEffect( () => {
		setUsageLevel( getUsageLevel( storageSize, storageLimit ) );
	}, [ storageSize, storageLimit ] );

	const sectionHeader = useMemo( () => {
		if ( usageLevel === StorageUsageLevels.Full ) {
			return __( 'Cloud storage full', 'jetpack-backup-pkg' );
		}

		if ( usageLevel === StorageUsageLevels.Critical ) {
			return __( 'Cloud storage is almost full', 'jetpack-backup-pkg' );
		}

		return __( 'Cloud storage space', 'jetpack-backup-pkg' );
	}, [ usageLevel ] );

	if ( ! showComponent ) {
		return null;
	}

	return (
		showComponent && (
			<>
				<h2>{ sectionHeader }</h2>
				<StorageMeter
					storageUsed={ storageSize }
					storageLimit={ storageLimit }
					usageLevel={ usageLevel }
				/>
				<StorageUsageDetails storageUsed={ storageSize } storageLimit={ storageLimit } />

				{ usageLevel !== StorageUsageLevels.Normal && (
					<StorageAddonUpsellPrompt usageLevel={ usageLevel } />
				) }
			</>
		)
	);
};

export default BackupStorageSpace;
