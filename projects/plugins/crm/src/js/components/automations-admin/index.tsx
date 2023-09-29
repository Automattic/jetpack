import { Col, Container } from '@automattic/jetpack-components';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import AdminPage from 'crm/components/admin-page';
import { useGetAutomationWorkflows } from 'crm/data/hooks/queries';
import { Workflow } from 'crm/state/automations-admin/types';
import { store } from 'crm/state/store';
import { Routes, Route } from 'react-router-dom';
import { RedirectHome } from './components/redirect-home';
import { WorkflowsHome } from './components/workflows-home';

export const AutomationsAdmin = () => {
	const hydrateWorkflows = ( workflows: Workflow[] ) => {
		dispatch( store ).hydrateWorkflows( workflows );
	};

	useGetAutomationWorkflows( hydrateWorkflows );

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
