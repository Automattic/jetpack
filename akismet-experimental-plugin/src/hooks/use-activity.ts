/**
 * `useActivity` — paginated Activity-log list.
 *
 * Thin wrapper over `activityListQuery()`. The factory's
 * `placeholderData: keepPreviousData` keeps the prior page visible
 * while a new filter / page loads so the table doesn't flash empty.
 */
import { useQuery } from '@tanstack/react-query';
import { activityListQuery } from '@/data/queries';
import type { ActivityQueryParams } from '@/routes/activity/activity-types';

/**
 * Fetch the Activity list for the given filter set.
 *
 * @param params - Page / per-page / category / outcome / source / search.
 * @return TanStack query result for `ActivityResponse`.
 */
export function useActivity( params: ActivityQueryParams ) {
	return useQuery( activityListQuery( params ) );
}
