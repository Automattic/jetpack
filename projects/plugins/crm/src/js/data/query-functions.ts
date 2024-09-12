import { Workflow, ServerPreparedWorkflow } from 'crm/state/automations-admin/types';
import { getServerPreparedWorkflow } from 'crm/state/automations-admin/util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

const v4ApiRoot = `${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4`;

type fetchAutomationsAPIOptions = {
	headers: HeadersInit;
	method: string;
	body?: string;
};

const callAutomationsAPI = async ( relative_url: string, payload?: object ) => {
	const options: fetchAutomationsAPIOptions = {
		headers: {
			'X-WP-Nonce': jpcrmAutomationsInitialState.apiNonce,
			'Content-Type': 'application/json',
		},
		method: 'GET',
	};
	if ( payload ) {
		options.method = 'POST';
		options.body = JSON.stringify( payload );
	}
	const response = await fetch( v4ApiRoot + relative_url, options );
	return await response.json();
};

// /wp-json/jetpack-crm/v4/automation/workflows
export const getAutomationWorkflows =
	( hydrate: ( workflows: Workflow[] ) => void ) => async () => {
		const result: Workflow[] = await callAutomationsAPI( '/automation/workflows' );
		result && hydrate( result );
		return result;
	};

// /wp-json/jetpack-crm/v4/automation/workflows/:id
export const postAutomationWorkflow = async ( workflow: Workflow ) => {
	const serverPreparedWorkflow = getServerPreparedWorkflow( workflow );

	const result: ServerPreparedWorkflow = await callAutomationsAPI(
		`/automation/workflows/${ workflow.id }`,
		serverPreparedWorkflow
	);
	return result;
};
