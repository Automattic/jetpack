import { AdminSection, Col, Container } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { RedirectHome } from './components/redirect-home';
import { WorkflowRow } from './components/workflow-row';
import { Workflow } from './types';

export const AutomationsAdmin = () => {
	const workflowOne: Workflow = {
		id: 0,
		name: 'Workflow name',
		description: '',
		category: '',
		triggers: [ { slug: '', title: '', category: '', description: 'Trigger description here' } ],
		initial_step: {
			attributes: [],
			slug: '',
			title: '',
			description: '',
			type: 'contacts',
			category: '',
			allowedTriggers: [],
		},
		active: true,
		version: 0,
		added: '01/23/4567',
	};

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
					<table id="workflow-test" style={ { padding: '20px', background: 'white' } }>
						<tr style={ { padding: '5px 10px' } }>
							<th style={ { padding: '5px 10px' } }>check</th>
							<th style={ { padding: '5px 10px' } }>Name</th>
							<th style={ { padding: '5px 10px' } }>Status</th>
							<th style={ { padding: '5px 10px' } }>Added</th>
							<th style={ { padding: '5px 10px' } }>Trigger</th>
							<th style={ { padding: '5px 10px' } }>Edit</th>
						</tr>
						<WorkflowRow workflow={ workflowOne } />
						<WorkflowRow workflow={ workflowOne } />
					</table>
				}
			/>
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};
