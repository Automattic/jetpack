import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { StorageUsageLevels } from '../storage-usage-levels';

const useStorageStatusText = usageLevel => {
	return useMemo( () => {
		switch ( usageLevel ) {
			case StorageUsageLevels.Warning:
				return __( 'You will reach your storage limit soon.', 'jetpack-backup-pkg' );
			case StorageUsageLevels.Critical:
				return __( "You're running out of storage space.", 'jetpack-backup-pkg' );
			case StorageUsageLevels.Full:
				return __( 'You ran out of storage space.', 'jetpack-backup-pkg' );
		}

		return null;
	}, [ usageLevel ] );
};

export default useStorageStatusText;
