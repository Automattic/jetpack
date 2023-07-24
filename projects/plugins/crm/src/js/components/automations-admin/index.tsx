import { AdminSection, Col, Container } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { RedirectHome } from './components/redirect-home';

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
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};
