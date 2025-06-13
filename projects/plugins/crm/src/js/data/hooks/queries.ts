import { useQuery } from '@tanstack/react-query';
import { getAutomationWorkflows } from 'crm/data/query-functions';
import { Workflow } from 'crm/state/automations-admin/types';

/**
 * Gets the Automation Workflows.
 *
 * @param {Function} hydrate - A function which takes an array of workflows and hydrates the store with them.
 * @return {import('@tanstack/react-query').UseQueryResult} - The result of the query.
 */
export const useGetAutomationWorkflows = ( hydrate: ( workflows: Workflow[] ) => void ) =>
	useQuery( {
		queryKey: [ 'automations', 'workflows' ],
		queryFn: getAutomationWorkflows( hydrate ),
		staleTime: Infinity,
		gcTime: Infinity,
		refetchOnWindowFocus: false,
	} );
