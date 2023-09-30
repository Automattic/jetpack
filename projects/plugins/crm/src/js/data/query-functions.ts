import axios from 'axios';
import { urls } from 'crm/data/urls';
import { Workflow, ServerPreparedWorkflow } from 'crm/state/automations-admin/types';
import { getServerPreparedWorkflow } from 'crm/state/automations-admin/util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

const api = axios.create( {
	baseURL: `${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4`,
	headers: { 'X-WP-Nonce': jpcrmAutomationsInitialState.apiNonce },
} );

export const getAutomationWorkflows =
	( hydrate: ( workflows: Workflow[] ) => void ) => async () => {
		const result = await api.get< Workflow[] >( urls.automation.workflows() );
		result.data && hydrate( result.data );
		return result;
	};

export const postAutomationWorkflow = async ( workflow: Workflow ) => {
	const serverPreparedWorkflow = getServerPreparedWorkflow( workflow );
	return await api.post< ServerPreparedWorkflow >(
		urls.automation.workflows( workflow.id ),
		serverPreparedWorkflow
	);
};
