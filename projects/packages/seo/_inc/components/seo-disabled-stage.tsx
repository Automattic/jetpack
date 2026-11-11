import DashboardPage from '../dashboard/dashboard-page';
import EnableSeoEmptyState from './enable-seo-empty-state';
import type { SeoTab } from '../dashboard/dashboard-nav';
import type { FC } from 'react';

/**
 * Show the enable prompt while retaining navigation to independent Settings.
 *
 * @param props        - Component props.
 * @param props.active - The current tab and Tracks screen.
 * @return The module-off stage for the given tab.
 */
const SeoDisabledStage: FC< { active: SeoTab } > = ( { active } ) => (
	<DashboardPage active={ active } showTabs centered>
		<EnableSeoEmptyState screen={ active } />
	</DashboardPage>
);

export default SeoDisabledStage;
