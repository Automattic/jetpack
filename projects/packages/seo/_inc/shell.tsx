/* eslint-disable jsdoc/require-returns */

import { AdminPage } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { JetpackSeoRoutes } from './constants';
import { HeaderActionsProvider, useHeaderActions } from './header-actions-context';
import styles from './style.module.scss';
import type { FC } from 'react';

type TabValue = 'overview' | 'content' | 'settings';

const TAB_TO_PATH: Record< TabValue, string > = {
	overview: JetpackSeoRoutes.Overview,
	content: JetpackSeoRoutes.Content,
	settings: JetpackSeoRoutes.Settings,
};

const pathToTab = ( pathname: string ): TabValue => {
	if ( pathname.startsWith( JetpackSeoRoutes.Content ) ) {
		return 'content';
	}
	if ( pathname.startsWith( JetpackSeoRoutes.Settings ) ) {
		return 'settings';
	}
	return 'overview';
};

/**
 * The chrome inside the HeaderActionsProvider. Split so the AdminPage
 * render can read header actions from context.
 */
const ShellChrome: FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const headerActions = useHeaderActions();

	const value = pathToTab( location.pathname );

	const onValueChange = useCallback(
		( nextValue: string ) => {
			const nextPath = TAB_TO_PATH[ nextValue as TabValue ];
			if ( nextPath && nextPath !== location.pathname ) {
				navigate( nextPath );
			}
		},
		[ location.pathname, navigate ]
	);

	// Overview and Settings get the neutral surface background
	// (--wpds-color-bg-surface-neutral = #fcfcfc from admin-ui). Content keeps
	// the default white so the DataViews table surfaces read correctly.
	const neutralBg = value === 'overview' || value === 'settings';

	return (
		<AdminPage
			className={ neutralBg ? styles.neutralBg : undefined }
			title={ __( 'SEO', 'jetpack-seo' ) }
			subTitle={ __(
				'The visibility command center — search engines, AI agents, sitemaps, and Schema, all in one place.',
				'jetpack-seo'
			) }
			actions={ headerActions }
			tabs={
				<div className={ styles.tabsBar }>
					<Tabs.Root value={ value } onValueChange={ onValueChange }>
						<Tabs.List variant="minimal">
							<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-seo' ) }</Tabs.Tab>
							<Tabs.Tab value="content">{ __( 'Content', 'jetpack-seo' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-seo' ) }</Tabs.Tab>
						</Tabs.List>
					</Tabs.Root>
				</div>
			}
			showFooter={ neutralBg }
		>
			<div className={ neutralBg ? styles.paddedContent : styles.fullBleed }>
				<Outlet />
			</div>
		</AdminPage>
	);
};

/**
 * Top-level chrome for the Jetpack SEO admin page.
 *
 * Header: `AdminPage` from `@automattic/jetpack-components` (shared with
 * Boost, Social, Protect, Backup, Forms).
 *
 * Tabs: `Tabs.Root` / `Tabs.List` / `Tabs.Tab` from `@wordpress/ui` with
 * `variant="minimal"` — the exact pattern Forms uses at
 * `projects/packages/forms/src/dashboard/components/forms-responses-tabs/`.
 * Route-driven via react-router; the tab value is derived from pathname,
 * clicks call `navigate()`.
 *
 * Routed screens inject header buttons (Save, etc.) via the
 * `HeaderActionsProvider` — see `header-actions-context.tsx`.
 */
const Shell: FC = () => (
	<HeaderActionsProvider>
		<ShellChrome />
	</HeaderActionsProvider>
);

export default Shell;
