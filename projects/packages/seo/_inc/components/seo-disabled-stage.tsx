import DashboardPage from '../dashboard/dashboard-page';
import EnableSeoEmptyState from './enable-seo-empty-state';
import type { SeoTab } from '../dashboard/dashboard-nav';
import type { FC } from 'react';

/**
 * Show the module activation prompt when the SEO dashboard cannot save settings.
 *
 * @param props        - Component props.
 * @param props.active - Current route.
 * @return The module activation prompt.
 */
const SeoDisabledStage: FC< { active: SeoTab } > = ( { active } ) => (
	<DashboardPage active={ active } showTabs={ false } centered>
		<EnableSeoEmptyState screen={ active } />
	</DashboardPage>
);

export default SeoDisabledStage;
