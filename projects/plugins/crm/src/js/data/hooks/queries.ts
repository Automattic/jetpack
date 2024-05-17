import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getAutomationWorkflows } from 'crm/data/query-functions';
import { Workflow } from 'crm/state/automations-admin/types';

/**
 * Gets the Automation Workflows.
 *
 * @param {Function} hydrate - A function which takes an array of workflows and hydrates the store with them.
 * @returns {UseQueryResult} - The result of the query.
 */
export const useGetAutomationWorkflows = ( hydrate: ( workflows: Workflow[] ) => void ) =>
	useQuery( {
		queryKey: [ 'automations', 'workflows' ],
		queryFn: getAutomationWorkflows( hydrate ),
		staleTime: Infinity,
		cacheTime: Infinity,
		refetchOnWindowFocus: false,
	} );
