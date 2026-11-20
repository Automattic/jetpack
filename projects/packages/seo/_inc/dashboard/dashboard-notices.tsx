import SearchVisibilityNotice from '../components/search-visibility-notice';
import SeoPausedBanner from '../components/seo-paused-banner';
import type { FC } from 'react';

/**
 * The site-wide banners shown above every tab's content. Each decides whether it applies.
 *
 * @return The banners that apply, in a wrapper that is empty when none do.
 */
const DashboardNotices: FC = () => (
	<div className="jetpack-seo-notices">
		<SearchVisibilityNotice />
		<SeoPausedBanner />
	</div>
);

export default DashboardNotices;
