import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import './style.scss';
import useConnection from '../../hooks/useConnection';
import { STORE_ID } from '../../store';
import { getUsageLevel, StorageUsageLevels } from './storage-usage-levels';
import { useStorageUsageText } from './use-usage-storage-text';

const BackupStorageSection = () => {
	const [ connectionStatus ] = useConnection();
	const isFetchingPolicies = useSelect( select => select( STORE_ID ).isFetchingRewindPolicies() );
	const isFetchingSize = useSelect( select => select( STORE_ID ).isFetchingRewindSize() );
	const sizeLoaded = useSelect( select => select( STORE_ID ).isRewindSizeLoaded() );
	const policiesLoaded = useSelect( select => select( STORE_ID ).areRewindPoliciesLoaded() );
	const hasStorageLimit = useSelect( select => select( STORE_ID ).hasRewindStorageLimit() );
	const storageLimit = useSelect( select => select( STORE_ID ).getRewindStorageLimit() );
	const storageSize = useSelect( select => select( STORE_ID ).getRewindSize() );
	const showComponent = sizeLoaded && policiesLoaded && hasStorageLimit;
	const [ usageLevel, setUsageLevel ] = useState( StorageUsageLevels.Normal );
	const usageText = useStorageUsageText( storageSize, storageLimit );
	const dispatch = useDispatch( STORE_ID );

	// Fetch rewind policies and site size
	useEffect( () => {
		const connectionLoaded = 0 < Object.keys( connectionStatus ).length;
		if ( ! connectionLoaded ) {
			return;
		}

		if ( ! isFetchingPolicies && ! policiesLoaded ) {
			dispatch.getSitePolicies();
		}

		if ( ! isFetchingSize && ! sizeLoaded ) {
			dispatch.getSiteSize();
		}
	}, [
		connectionStatus,
		policiesLoaded,
		sizeLoaded,
		isFetchingPolicies,
		isFetchingSize,
		dispatch,
	] );

	// Set usage level
	useEffect( () => {
		if ( showComponent ) {
			setUsageLevel( getUsageLevel( storageSize, storageLimit ) );
		}
	}, [ showComponent, storageSize, storageLimit ] );

	const PROGRESS_BAR_CLASS_NAMES = {
		[ StorageUsageLevels.Full ]: 'full-warning',
		[ StorageUsageLevels.Critical ]: 'red-warning',
		[ StorageUsageLevels.Warning ]: 'yellow-warning',
		[ StorageUsageLevels.Normal ]: 'no-warning',
	};

	return (
		showComponent && (
			<>
				<h2>
					{ usageLevel === StorageUsageLevels.Full
						? __( 'Cloud storage full', 'jetpack-backup-pkg' )
						: __( 'Your cloud storage', 'jetpack-backup-pkg' ) }
				</h2>
				<div className="backup-storage-space__progress-bar">
					<ProgressBar
						className={ PROGRESS_BAR_CLASS_NAMES[ usageLevel ] }
						value={ storageSize ?? 0 }
						total={ storageLimit ?? Infinity }
					/>
				</div>
				<p>Using { usageText }</p>
			</>
		)
	);
};

export default BackupStorageSection;
