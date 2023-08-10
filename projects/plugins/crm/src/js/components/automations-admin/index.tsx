import { AdminSection, Col, Container } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { RedirectHome } from './components/redirect-home';
import { WorkflowRow } from './components/workflow-row';
import { workflowOne, workflowTwo } from './test/test-data';

export const AutomationsAdmin = () => {
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
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};
