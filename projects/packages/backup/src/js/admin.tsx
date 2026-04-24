import { createHashRouter, RouterProvider } from 'react-router';
import Providers from './providers';
import DownloadScreen from './screens/download';
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
			{ index: true, element: <OverviewScreen /> },
			// Child paths must be relative (no leading slash) — otherwise
			// the `*` catch-all wins and clicking a nav button changes the
			// URL without swapping the rendered screen.
			{ path: 'download', element: <DownloadScreen /> },
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
