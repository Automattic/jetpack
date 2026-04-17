import { createRoot } from '@wordpress/element';
import { createHashRouter, RouterProvider } from 'react-router';
import { JetpackSeoRoutes } from './constants';
import Providers from './providers';
import ContentScreen from './screens/content';
import OverviewScreen from './screens/overview';
import SettingsScreen from './screens/settings';
import Shell from './shell';
import './style.module.scss';

// Use the data router (`createHashRouter` + `RouterProvider`) rather than the
// declarative `<HashRouter>` component. `useBlocker` — which the Settings
// screen uses to warn about unsaved changes — only works inside a data router.
const router = createHashRouter( [
	{
		element: <Shell />,
		children: [
			{ path: JetpackSeoRoutes.Overview, element: <OverviewScreen /> },
			{ path: JetpackSeoRoutes.Content, element: <ContentScreen /> },
			{ path: JetpackSeoRoutes.Settings, element: <SettingsScreen /> },
			{ path: '*', element: <OverviewScreen /> },
		],
	},
] );

const App = () => (
	<Providers>
		<RouterProvider router={ router } />
	</Providers>
);

const container = document.getElementById( 'jetpack-seo-root' );
if ( container ) {
	createRoot( container ).render( <App /> );
}
