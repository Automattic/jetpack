import axios from 'axios';
import { Workflow, ServerPreparedWorkflow } from 'crm/state/automations-admin/types';
import { getServerPreparedWorkflow } from 'crm/state/automations-admin/util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

const v4ApiRoot = `${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4`;

const api = axios.create( {
	baseURL: v4ApiRoot,
	headers: { 'X-WP-Nonce': jpcrmAutomationsInitialState.apiNonce },
} );

// /wp-json/jetpack-crm/v4/automation/workflows
export const getAutomationWorkflows =
	( hydrate: ( workflows: Workflow[] ) => void ) => async () => {
		const result = await api.get< Workflow[] >( '/automation/workflows' );
		result.data && hydrate( result.data );
		return result;
	};

// /wp-json/jetpack-crm/v4/automation/workflows/:id
export const postAutomationWorkflow = async ( workflow: Workflow ) => {
	const serverPreparedWorkflow = getServerPreparedWorkflow( workflow );
	return await api.post< ServerPreparedWorkflow >(
		`/automation/workflows/${ workflow.id }`,
		serverPreparedWorkflow
	);
};
