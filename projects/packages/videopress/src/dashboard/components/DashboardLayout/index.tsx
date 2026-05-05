/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import DashboardTabs, { type DashboardTab } from '../DashboardTabs';
import type { ReactNode } from 'react';
/**
 * Internal dependencies
 */

type Props = {
	activeTab: DashboardTab;
	children: ReactNode;
};

/**
 * Shared chrome for every wp-build VideoPress dashboard tab. Wraps the
 * route's body in `AdminPage` (which renders the Jetpack header + footer)
 * and slots `DashboardTabs` into AdminPage's `tabs` prop so the tab strip
 * sits between the title and the body.
 *
 * @param props           - Component props.
 * @param props.activeTab - Currently active tab.
 * @param props.children  - Tab body content.
 * @return The wrapped page element.
 */
export default function DashboardLayout( { activeTab, children }: Props ) {
	return (
		<AdminPage
			title={ 'VideoPress' /* product name; not translated */ }
			subTitle={ __( 'Professional quality, ad-free video hosting.', 'jetpack-videopress-pkg' ) }
			tabs={ <DashboardTabs activeTab={ activeTab } /> }
		>
			{ children }
		</AdminPage>
	);
}
