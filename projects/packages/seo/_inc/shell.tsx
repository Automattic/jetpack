/* eslint-disable jsdoc/require-returns */

import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Outlet } from 'react-router';
import { HeaderActionsProvider, useHeaderActions } from './header-actions-context';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * The chrome inside the HeaderActionsProvider. Split so the AdminPage
 * render can read header actions from context.
 */
const ShellChrome: FC = () => {
	const headerActions = useHeaderActions();

	return (
		<AdminPage
			className={ styles.neutralBg }
			title={ __( 'SEO', 'jetpack-seo' ) }
			subTitle={ __(
				'Visibility tools for your site — sitemaps, canonical URLs, and search-engine settings, in one place.',
				'jetpack-seo'
			) }
			actions={ headerActions }
			showFooter
		>
			<div className={ styles.paddedContent }>
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
 * Routed screens inject header buttons (Save, etc.) via the
 * `HeaderActionsProvider` — see `header-actions-context.tsx`.
 */
const Shell: FC = () => (
	<HeaderActionsProvider>
		<ShellChrome />
	</HeaderActionsProvider>
);

export default Shell;
