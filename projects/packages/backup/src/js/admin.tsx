import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Providers from './providers';
import DownloadScreen from './screens/download';
import OverviewScreen from './screens/overview';
import RestoreScreen from './screens/restore';
import Shell from './shell';
import type { FC } from 'react';

// Use react-router 7's data-router API (createHashRouter +
// RouterProvider) — same pattern Jetpack Forms uses successfully in
// wp-admin. The data router maintains its own external store and
// doesn't rely on the per-component history.listen subscription that
// stalls under WP's canary ReactDOM, so navigation re-renders without
// the HashRouter remount workaround we used to need.
const router = createHashRouter( [
	{
		path: '/',
		element: <Shell />,
		children: [
			{ index: true, element: <OverviewScreen /> },
			{ path: 'download', element: <DownloadScreen /> },
			{ path: 'restore', element: <RestoreScreen /> },
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
