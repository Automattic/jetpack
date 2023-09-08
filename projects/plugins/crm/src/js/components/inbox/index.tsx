import { __ } from '@wordpress/i18n';
import { useMessagesQuery } from 'crm/state/inbox/hooks';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import AdminPage from '../admin-page';
import { Inbox } from './components/inbox';
export const InboxAdmin: React.FC = () => {
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
				path="/inbox"
				element={
					<AdminPage
						headline={ __( 'Inbox', 'zero-bs-crm' ) }
						subHeadline={ __( 'The Incredible Jetpack CRM Inbox', 'zero-bs-crm' ) }
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
		navigate( '/inbox' );
	} );

	return null;
};
