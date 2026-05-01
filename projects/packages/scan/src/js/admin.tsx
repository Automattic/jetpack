import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Providers from './providers';
import OverviewScreen from './screens/overview';
import Shell from './shell';
import type { FC } from 'react';

// react-router 7's data-router API (createHashRouter + RouterProvider) —
// the same pattern Backup, Activity Log, and Forms use successfully in
// wp-admin. The data router maintains its own external store and surfaces
// location changes via `router.subscribe`, so children re-render normally
// on navigation under WP's canary ReactDOM without the HashRouter remount
// workaround the legacy Protect Admin/index.js needed.
const router = createHashRouter( [
	{
		path: '/',
		element: <Shell />,
		children: [
			{ index: true, element: <OverviewScreen /> },
			{ path: '*', element: <OverviewScreen /> },
		],
	},
] );

const App: FC = () => (
	<Providers>
		<RouterProvider router={ router } />
	</Providers>
);

export default App;
