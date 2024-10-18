import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Site } from '../types';

interface Props {
	site: Site;
}

const WpcomLaunchpadWidget = ( { site }: Props ) => {
	const { domain } = site;

	return (
		<QueryClientProvider client={ new QueryClient() }>
			<Launchpad siteSlug={ domain } checklistSlug="build" launchpadContext="dashboard-widget" />
		</QueryClientProvider>
	);
};

export default WpcomLaunchpadWidget;
