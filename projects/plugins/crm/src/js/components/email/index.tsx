import { AdminSection } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';

export const EmailsAdmin = () => {
	return (
		<Routes>
			<Route
				path="/emails"
				element={
					<AdminPage
						headline={ __( 'Emails', 'zero-bs-crm' ) }
						subHeadline={ __( 'Send emails with Jetpack CRM', 'zero-bs-crm' ) }
					>
						<AdminSection>
							<div>This is the emails page</div>
						</AdminSection>
					</AdminPage>
				}
			/>
			<Route path="*" element={ <RedirectHome /> } />
		</Routes>
	);
};

export const RedirectHome: React.FC = () => {
	const navigate = useNavigate();

	useEffect( () => {
		navigate( '/emails' );
	} );

	return null;
};
