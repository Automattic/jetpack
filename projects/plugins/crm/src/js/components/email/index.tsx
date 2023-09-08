import { __ } from '@wordpress/i18n';
import { useMessagesQuery } from 'crm/state/email/hooks';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { Inbox } from './components/inbox';
export const EmailsAdmin: React.FC = () => {
	const { data } = useMessagesQuery();

	// TODO: implement a loading screen
	// if ( isLoading ) {
	// 	return 'loading...';
	// }

	// if ( error ) {
	// 	return error;
	// }

	const { contacts, messages } = data ?? { contacts: [], messages: [] };

	return (
		<Routes>
			<Route
				path="/emails"
				element={
					<AdminPage
						headline={ __( 'Emails', 'zero-bs-crm' ) }
						subHeadline={ __( 'Send emails with Jetpack CRM', 'zero-bs-crm' ) }
					>
						{ /* TODO: fix this marginLeft thing */ }
						<div style={ { marginLeft: '30px' } }>
							<Inbox contacts={ contacts } messages={ messages } />
						</div>
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
