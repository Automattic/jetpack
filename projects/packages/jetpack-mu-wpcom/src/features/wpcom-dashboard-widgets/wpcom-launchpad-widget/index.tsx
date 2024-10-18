import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Site } from '../types';
import './style.scss';

interface Props {
	site: Site;
}

const WpcomLaunchpadWidget = ( { site }: Props ) => {
	const { domain, siteIntent } = site;

	return (
		<QueryClientProvider client={ new QueryClient() }>
			<Launchpad
				siteSlug={ domain }
				checklistSlug={ siteIntent }
				launchpadContext="dashboard-widget"
			/>
		</QueryClientProvider>
	);
};

export default WpcomLaunchpadWidget;
