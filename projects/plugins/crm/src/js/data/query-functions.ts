import axios from 'axios';
import { urls } from 'crm/data/urls';
import { Workflow } from 'crm/state/automations-admin/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

const getAxiosHeader = () => ( { 'X-WP-Nonce': jpcrmAutomationsInitialState.apiNonce } );

export const getAutomationWorkflows =
	( hydrate: ( workflows: Workflow[] ) => void ) => async () => {
		const result = await axios.get< Workflow[] >( urls.automation.workflows(), {
			headers: getAxiosHeader(),
		} );
		result.data && hydrate( result.data );
		return result;
	};

export const postAutomationWorkflow = async ( workflow: Workflow ) => {
	return await axios.post< Workflow >( urls.automation.workflows( workflow.id ), workflow );
};
