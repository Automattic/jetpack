import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBackupRetention } from '../data/api/backup-retention';
import { keys } from '../data/query-client';
import { useAnalytics } from './use-analytics';

/**
 * React Query mutation that changes how many days of backups WordPress.com keeps.
 *
 * Settles only after `/site/backup/size`, which carries `retention_days`, is re-read,
 * failures included, as `useUpdateBackupSchedule` does.
 *
 * @return The mutation; `mutate` takes one of `RETENTION_OPTIONS`.
 */
export function useUpdateBackupRetention() {
	const queryClient = useQueryClient();
	const { tracks } = useAnalytics();

	return useMutation( {
		mutationFn: updateBackupRetention,
		onSuccess: ( _data, days ) => {
			tracks.recordEvent( 'jetpack_backup_storage_retention_update', { retention_option: days } );
		},
		onSettled: () => queryClient.invalidateQueries( { queryKey: keys.siteSize() } ),
	} );
}
