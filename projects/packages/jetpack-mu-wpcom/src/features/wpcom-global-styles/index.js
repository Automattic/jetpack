import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import GlobalStylesNotices from './notices';
import './store';

const showGlobalStylesComponents = () => {
	registerPlugin( 'wpcom-global-styles', {
		render: () => (
			<QueryClientProvider client={ new QueryClient() }>
				<GlobalStylesNotices />
			</QueryClientProvider>
		),
	} );
};

domReady( () => {
	showGlobalStylesComponents();
} );
