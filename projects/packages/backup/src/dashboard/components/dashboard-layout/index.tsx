import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import QueryClientProvider from '../../providers/query-client-provider';
import DevModeBanner from '../dev-mode-banner';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
	actions?: ReactNode;
};

/**
 * Shared shell for every screen of the modernized Backup dashboard.
 *
 * Wraps a `<Page>` from `@wordpress/admin-ui` (which provides the standard
 * wp-admin chrome) with the dev-mode banner and a centered, max-width body
 * container that every screen renders into.
 *
 * @param props          - Component props.
 * @param props.children - Screen contents to render inside the page body.
 * @param props.actions  - Optional nodes rendered in the page header's top-right action slot.
 * @return The rendered dashboard shell.
 */
export default function DashboardLayout( { children, actions }: Props ) {
	return (
		<Page
			title="VaultPress Backup"
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-backup-pkg'
			) }
			hasPadding={ false }
			actions={ actions }
		>
			<DevModeBanner />
			<QueryClientProvider>
				<div className="jpb-dashboard-body">{ children }</div>
			</QueryClientProvider>
		</Page>
	);
}
