import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AutomationsAdminContainer } from './components/automations-admin-container';

export const AutomationsAdmin = () => {
	const router = createHashRouter( [
		{
			path: '/automations',
			element: (
				<AutomationsAdminContainer>
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
					<a href="#/automations">Go back to home</a>
				</AutomationsAdminContainer>
			),
		},
		{
			path: '/automations/add',
			element: (
				<AutomationsAdminContainer>
					<a href="#/automations">Go back to home</a>
				</AutomationsAdminContainer>
			),
		},
	] );

	return <RouterProvider router={ router } />;
};
