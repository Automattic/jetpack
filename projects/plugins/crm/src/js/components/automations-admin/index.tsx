import { Button, AdminSection, Col, Container } from '@automattic/jetpack-components';
import { useQuery } from '@tanstack/react-query';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import axios from 'axios';
import { Workflow } from 'crm/state/automations-admin/types';
import { store } from 'crm/state/store';
import { useCallback, useState } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { BulkWorkflowActions } from './components/bulk-workflow-actions';
import { EditModal } from './components/edit-modal';
import { RedirectHome } from './components/redirect-home';
import { WorkflowRow } from './components/workflow-row';
import { WorkflowTable } from './components/workflow-table';
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
				`${ jpcrmAutomationsInitialState.apiRoot }jetpack-crm/v4/automation/workflows`
			);
			dispatch( store ).hydrateWorkflows( result?.data );
			return result;
		},
		staleTime: Infinity,
		cacheTime: Infinity,
		refetchOnWindowFocus: false,
	} );

	const workflows = useSelect( select => select( store ).getWorkflows(), [] );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const workflow = ( workflows as any ).testing as Workflow;

	return (
		<Routes>
			<Route
				path="/automations"
				element={
					<AdminPage
						headline={ __( 'Automations', 'zero-bs-crm' ) }
						subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
					>
						<AdminSection>
							<Container horizontalSpacing={ 8 }>
								<Col>
									<div>This is the home page</div>
									<br />
									<Link to={ '/automations/edit' }>Go to edit</Link>
									<br />
									<Link to={ '/automations/add' }>Go to add</Link>
								</Col>
							</Container>
						</AdminSection>
					</AdminPage>
				}
			/>
			<Route
				path="/automations/add"
				element={
					<AdminPage
						headline={ __( 'Add Automation', 'zero-bs-crm' ) }
						subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
					>
						<AdminSection>
							<Container horizontalSpacing={ 8 }>
								<Col>
									<div>This is the add page</div>
									<br />
									<Link to={ '/automations/edit' }>Go to edit</Link>
									<br />
									<Link to={ '/automations' }>Go back to home</Link>
								</Col>
							</Container>
						</AdminSection>
					</AdminPage>
				}
			/>
			<Route
				path="/automations/edit"
				element={
					<AdminPage
						headline={ __( 'Edit Automation', 'zero-bs-crm' ) }
						subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
					>
						<AdminSection>
							<Container horizontalSpacing={ 8 }>
								<Col>
									<div>This is the edit page</div>
									<br />
									<Link to={ '/automations/add' }>Go to add</Link>
									<br />
									<Link to={ '/automations' }>Go back to home</Link>
								</Col>
							</Container>
						</AdminSection>
					</AdminPage>
				}
			/>
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
				element={ <WorkflowTable workflows={ [ workflowOne, workflowTwo ] } /> }
			/>
			<Route
				path="/automations/test-workflow-bulk-actions"
				element={
					<div style={ { display: 'flex', flexDirection: 'column', background: 'white' } }>
						<BulkWorkflowActions />
						<WorkflowTable workflows={ [ workflowOne, workflowTwo ] } />
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
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};
