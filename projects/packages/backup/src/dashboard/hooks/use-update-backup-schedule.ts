import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBackupSchedule } from '../data/api/backup-schedule';
import { keys } from '../data/query-client';
import { useAnalytics } from './use-analytics';

/**
 * React Query mutation that moves the daily backup to another UTC hour.
 *
 * Settles only after the schedule is re-read, so whatever closes on success leaves the
 * next-backup line already showing the new window. Failures re-read too: a timeout can
 * arrive after WordPress.com has saved the hour.
 *
 * @return The mutation; `mutate` takes the hour, 0–23, in UTC.
 */
export function useUpdateBackupSchedule() {
	const queryClient = useQueryClient();
	const { tracks } = useAnalytics();

	return useMutation( {
		mutationFn: updateBackupSchedule,
		onSuccess: ( _data, hour ) => {
			tracks.recordEvent( 'jetpack_backup_schedule_update', { scheduled_hour: hour } );
		},
		onSettled: () => queryClient.invalidateQueries( { queryKey: keys.backupSchedule() } ),
	} );
}
