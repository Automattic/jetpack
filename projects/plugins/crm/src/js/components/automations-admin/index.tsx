import { AdminSection, Col, Container } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import AdminPage from '../admin-page';
import { RedirectHome } from './components/redirect-home';

export const AutomationsAdmin = () => {
	const router = createHashRouter( [
		{
			path: '/automations',
			element: (
				<AdminPage
					headline={ __( 'Automations', 'zero-bs-crm' ) }
					subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
				>
					<AdminSection>
						<Container horizontalSpacing={ 8 }>
							<Col>
								<div>This is the home page</div>
								<br />
								<a href="#/automations/edit">Go to edit</a>
								<br />
								<a href="#/automations/add">Go to add</a>
							</Col>
						</Container>
					</AdminSection>
				</AdminPage>
			),
		},
		{
			path: '/automations/add',
			element: (
				<AdminPage
					headline={ __( 'Add Automation', 'zero-bs-crm' ) }
					subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
				>
					<AdminSection>
						<Container horizontalSpacing={ 8 }>
							<Col>
								<div>This is the add page</div>
								<br />
								<a href="#/automations/edit">Go to edit</a>
								<br />
								<a href="#/automations">Go back to home</a>
							</Col>
						</Container>
					</AdminSection>
				</AdminPage>
			),
		},
		{
			path: '/automations/edit',
			element: (
				<AdminPage
					headline={ __( 'Edit Automation', 'zero-bs-crm' ) }
					subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
				>
					<AdminSection>
						<Container horizontalSpacing={ 8 }>
							<Col>
								<div>This is the edit page</div>
								<br />
								<a href="#/automations/add">Go to add</a>
								<br />
								<a href="#/automations">Go back to home</a>
							</Col>
						</Container>
					</AdminSection>
				</AdminPage>
			),
		},
		{
			path: '*',
			element: <RedirectHome />,
		},
	] );

	return <RouterProvider router={ router } />;
};
