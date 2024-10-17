import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const WpcomLaunchpadWidget = ( { siteDomain } ) => {
	return (
		<QueryClientProvider client={ new QueryClient() }>
			<Launchpad
				siteSlug={ siteDomain }
				checklistSlug="build"
				launchpadContext="dashboard-widget"
			/>
		</QueryClientProvider>
	);
};

export default WpcomLaunchpadWidget;
