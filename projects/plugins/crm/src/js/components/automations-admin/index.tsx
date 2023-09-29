import { Col, Container } from '@automattic/jetpack-components';
import { useQuery } from '@tanstack/react-query';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import axios from 'axios';
import AdminPage from 'crm/components/admin-page';
import { Workflow } from 'crm/state/automations-admin/types';
import { store } from 'crm/state/store';
import { Routes, Route } from 'react-router-dom';
import { RedirectHome } from './components/redirect-home';
import { WorkflowsHome } from './components/workflows-home';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

export const AutomationsAdmin = () => {
	useQuery( {
		queryKey: [ 'automations', 'workflows' ],
		queryFn: async () => {
			const result = await axios.get< Workflow[] >(
				`${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4/automation/workflows`,
				{
					headers: {
						'X-WP-Nonce': jpcrmAutomationsInitialState.apiNonce,
					},
				}
			);
			dispatch( store ).hydrateWorkflows( result?.data );
			return result;
		},
		staleTime: Infinity,
		cacheTime: Infinity,
		refetchOnWindowFocus: false,
	} );

	const workflows = useSelect( select => select( store ).getWorkflows(), [] );

	return (
		<Routes>
			<Route
				path="/automations/:id?"
				element={
					<AdminPage
						headline={ __( 'Automations', 'zero-bs-crm' ) }
						subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
					>
						<Container>
							<Col>
								<WorkflowsHome workflows={ workflows } />
							</Col>
						</Container>
					</AdminPage>
				}
			/>
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};
