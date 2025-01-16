import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './style.scss';

const queryClient = new QueryClient();

export default ( { siteDomain, siteIntent } ) => {
	return (
		<QueryClientProvider client={ queryClient }>
			<Launchpad
				siteSlug={ siteDomain }
				checklistSlug={ siteIntent }
				launchpadContext="dashboard-widget"
			/>
		</QueryClientProvider>
	);
};
