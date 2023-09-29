import { Col, Container } from '@automattic/jetpack-components';
import { Button } from '@automattic/jetpack-components';
import { useQuery } from '@tanstack/react-query';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import axios from 'axios';
import AdminPage from 'crm/components/admin-page';
import { Workflow } from 'crm/state/automations-admin/types';
import { store } from 'crm/state/store';
import { useCallback, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BulkWorkflowActions } from './components/bulk-workflow-actions';
import { EditModal } from './components/edit-modal';
import { RedirectHome } from './components/redirect-home';
import { WorkflowRow } from './components/workflow-row';
import { WorkflowTable } from './components/workflow-table';
import { WorkflowsHome } from './components/workflows-home';
import { workflowOne, workflowTwo } from './test/util/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmAutomationsInitialState: any;

export const AutomationsAdmin = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
	}, [ setIsModalOpen ] );

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
	const workflow = Object.values( workflows )[ 0 ];

	return (
		<Routes>
			<Route
				path="/automations/test-workflow-row"
				element={
					<table
						id="workflow-test"
						style={ { padding: '20px', background: 'white', width: '100%' } }
					>
						<tr style={ { padding: '5px 10px' } }>
							<th style={ { padding: '5px 10px' } }>check</th>
							<th style={ { padding: '5px 10px' } }>Name</th>
							<th style={ { padding: '5px 10px' } }>Status</th>
							<th style={ { padding: '5px 10px' } }>Added</th>
							<th style={ { padding: '5px 10px' } }>Trigger</th>
							<th style={ { padding: '5px 10px' } }>Edit</th>
						</tr>
						<WorkflowRow workflow={ workflowOne } />
						<WorkflowRow workflow={ workflowTwo } />
					</table>
				}
			/>
			<Route
				path="/automations/test-workflow-table"
				element={ <WorkflowTable workflows={ Object.values( workflows ) } /> }
			/>
			<Route
				path="/automations/test-workflow-bulk-actions"
				element={
					<div style={ { display: 'flex', flexDirection: 'column', background: 'white' } }>
						<BulkWorkflowActions />
						<WorkflowTable workflows={ Object.values( workflows ) } />
					</div>
				}
			/>
			<Route
				path="/automations/test-edit-modal"
				element={
					workflow && (
						<div style={ { margin: '24px' } }>
							<Button onClick={ () => setIsModalOpen( true ) }>
								Click here to open the modal.
							</Button>
							<EditModal isOpen={ isModalOpen } onClose={ closeModal } workflow={ workflow } />
						</div>
					)
				}
			/>
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
