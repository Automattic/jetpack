import { createHashRouter, RouterProvider } from 'react-router';
import Providers from './providers';
import { JetpackBackupRoutes } from './routes';
import OverviewScreen from './screens/overview';
import Shell from './shell';
import type { FC } from 'react';

// Hash router: wp-admin owns `window.location.pathname`, so routed state
// lives under `#/…`. `createHashRouter` gives us the data router API which
// is what screens will use for navigation and (later) unsaved-changes
// blockers.
const router = createHashRouter( [
	{
		element: <Shell />,
		children: [
			{ path: JetpackBackupRoutes.Overview, element: <OverviewScreen /> },
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
