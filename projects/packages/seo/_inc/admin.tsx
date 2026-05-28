import { createRoot } from '@wordpress/element';
import { createHashRouter, RouterProvider } from 'react-router';
import { JetpackSeoRoutes } from './constants';
import Providers from './providers';
import OverviewScreen from './screens/overview';
import Shell from './shell';
import './admin-page-layout.scss';
import './style.module.scss';

// Data router (`createHashRouter` + `RouterProvider`) rather than declarative
// `<HashRouter>`, so future screens can use `useBlocker` for unsaved-changes
// guards.
const router = createHashRouter( [
	{
		element: <Shell />,
		children: [
			{ path: JetpackSeoRoutes.Overview, element: <OverviewScreen /> },
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
