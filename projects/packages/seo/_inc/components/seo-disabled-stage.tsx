import DashboardPage from '../dashboard/dashboard-page';
import overviewStyles from '../screens/overview/style.module.scss';
import EnableSeoCard from './enable-seo-card';
import type { SeoTab } from '../dashboard/dashboard-nav';
import type { FC } from 'react';

/**
 * The stage a tab renders when the `seo-tools` module is off. Keeps the shared
 * dashboard chrome (so the tab navigation stays visible) but swaps the tab's
 * editable controls for the enable-SEO-tools card: those controls have nothing
 * to act on while the module is inactive, and their REST endpoints aren't even
 * registered (see `Initializer::init()`), so they'd be editable-but-dead.
 *
 * Mirrors the Overview's own module-off state, column included, so Settings /
 * Content / GEO behave and line up consistently with it. Enabling SEO tools
 * reloads the page (see `useSeoToolsToggle`), bringing the full surface online.
 *
 * @param props        - Component props.
 * @param props.active - The tab whose stage is being gated.
 * @return The module-off stage for the given tab.
 */
const SeoDisabledStage: FC< { active: SeoTab } > = ( { active } ) => (
	<DashboardPage active={ active }>
		<div className={ overviewStyles.root }>
			<EnableSeoCard screen={ active } />
		</div>
	</DashboardPage>
);

export default SeoDisabledStage;
