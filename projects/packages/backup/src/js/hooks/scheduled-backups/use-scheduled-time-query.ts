import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

export interface ScheduledTimeApi {
	ok: boolean;
	scheduled_hour: number;
	scheduled_by: string | null;
}

export interface ScheduledTime {
	scheduledHour: number;
	scheduledBy: string | null;
}

const useScheduledTimeQuery = (): UseQueryResult< ScheduledTime, Error > => {
	const queryKey = [ 'jetpack-backup-scheduled-time' ];

	return useQuery< ScheduledTimeApi, Error, ScheduledTime >( {
		queryKey,
		queryFn: async () =>
			apiFetch( { path: `/jetpack/v4/site/backup/schedule` } ) as Promise< ScheduledTimeApi >,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: false,
		select: data => ( {
			scheduledHour: data.scheduled_hour,
			scheduledBy: data.scheduled_by,
		} ),
	} );
};

export default useScheduledTimeQuery;
