import { useMutation } from '@tanstack/react-query';
import { postAutomationWorkflow } from 'crm/data/query-functions';

export const useMutateAutomationWorkflows = () => {
	return useMutation( postAutomationWorkflow );
};
