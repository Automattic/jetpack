import SearchVisibilityNotice from '../components/search-visibility-notice';
import SeoPausedBanner from '../components/seo-paused-banner';
import isSeoToolsActive from '../data/is-seo-tools-active';
import type { FC } from 'react';

/**
 * The site-wide banners shown above every tab's content. The paused banner needs SEO
 * tools on: while they're off, the pause isn't what stops the output.
 *
 * @return The banners that apply, in a wrapper that is empty when none do.
 */
const DashboardNotices: FC = () => (
	<div className="jetpack-seo-notices">
		<SearchVisibilityNotice />
		{ isSeoToolsActive() && <SeoPausedBanner /> }
	</div>
);

export default DashboardNotices;
