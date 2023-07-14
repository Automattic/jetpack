import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AutomationsAdminContainer } from './components/automations-admin-container';
import { RedirectHome } from './components/redirect-home';

export const AutomationsAdmin = () => {
	const router = createHashRouter( [
		{
			path: '/automations',
			element: (
				<AutomationsAdminContainer>
					<div>This is the home page</div>
					<br />
					<a href="#/automations/edit">Go to edit</a>
					<br />
					<a href="#/automations/add">Go to add</a>
				</AutomationsAdminContainer>
			),
		},
		{
			path: '/automations/edit',
			element: (
				<AutomationsAdminContainer>
					<div>This is the edit page</div>
					<br />
					<a href="#/automations/add">Go to add</a>
					<br />
					<a href="#/automations">Go back to home</a>
				</AutomationsAdminContainer>
			),
		},
		{
			path: '/automations/add',
			element: (
				<AutomationsAdminContainer>
					<div>This is the add page</div>
					<br />
					<a href="#/automations/edit">Go to edit</a>
					<br />
					<a href="#/automations">Go back to home</a>
				</AutomationsAdminContainer>
			),
		},
		{
			path: '*',
			element: <RedirectHome />,
		},
	] );

	return <RouterProvider router={ router } />;
};
