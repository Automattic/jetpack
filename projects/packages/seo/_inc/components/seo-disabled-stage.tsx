import DashboardPage from '../dashboard/dashboard-page';
import { isGated } from '../data/is-gated';
import EnableSeoEmptyState from './enable-seo-empty-state';
import type { SeoTab } from '../dashboard/dashboard-nav';
import type { FC } from 'react';

/**
 * The stage every tab renders when the `seo-tools` module is off: the page
 * header and the enable-SEO-tools empty state, centered in the content area,
 * with the tabs hidden. The tabs' controls have nothing to act on while the
 * module is inactive, and their REST endpoints aren't even registered (see
 * `Initializer::init()`), so they'd be editable-but-dead; hiding the tab bar
 * keeps the page from offering tabs that all lead to this same message.
 *
 * Plan-gated sites keep the tabs: their reduced Overview stays up with the
 * module off (see the Overview route stage), so this stage, reached there only
 * from Settings, needs the tab bar to lead back to it.
 *
 * Enabling SEO tools reloads the page (see `useSeoToolsToggle`), bringing the
 * full surface online.
 *
 * @param props        - Component props.
 * @param props.active - The route being gated; used for Tracks, not shown.
 * @return The module-off stage for the given tab.
 */
const SeoDisabledStage: FC< { active: SeoTab } > = ( { active } ) => (
	<DashboardPage active={ active } showTabs={ isGated() } centered>
		<EnableSeoEmptyState screen={ active } />
	</DashboardPage>
);

export default SeoDisabledStage;
