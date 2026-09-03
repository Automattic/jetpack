/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Tabs } from '@wordpress/ui';
import DashboardTabs, { TAB_PATHS, type DashboardTab } from '../dashboard-tabs';
import OnboardingModal from '../onboarding-modal';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	activeTab: DashboardTab;
	children: ReactNode;
	actions?: ReactNode;
	hideFooter?: boolean;
};

const TAB_VALUES: DashboardTab[] = [ 'library', 'stats', 'settings' ];

/**
 * Shared chrome for every wp-build VideoPress dashboard tab. Renders
 * `AdminPage` (with header + JetpackFooter) and a `Tabs.Root` containing
 * the strip and one `Tabs.Panel` per tab so the `@wordpress/ui` Tabs
 * Tab/Panel pairing validator stays happy. Tab navigation between
 * sibling routes happens via `@wordpress/route`'s useNavigate.
 *
 * @param props            - Component props.
 * @param props.activeTab  - Currently active tab.
 * @param props.children   - Active tab's body content.
 * @param props.actions    - Optional content rendered in the page header's
 *                         top-right actions slot (e.g. a Save button).
 * @param props.hideFooter - When true, suppresses the JetpackFooter rendered by
 *                         AdminPage. Used by DataViews-centric tabs (e.g. Library).
 * @return The wrapped page element.
 */
export default function DashboardLayout( { activeTab, children, actions, hideFooter }: Props ) {
	const navigate = useNavigate();
	const { hasConnectionError } = useConnectionErrorNotice();

	const onValueChange = useCallback(
		( next: string ) => {
			const target = TAB_PATHS[ next as DashboardTab ];
			if ( target ) {
				navigate( { href: target } );
			}
		},
		[ navigate ]
	);

	return (
		<AdminPage
			title={ 'VideoPress' /* product name; not translated */ }
			subTitle={ __(
				'Host, manage, customize, and track your videos — all in one place.',
				'jetpack-videopress-pkg'
			) }
			actions={ actions }
			showFooter={ ! hideFooter }
		>
			{ hasConnectionError && (
				<Stack direction="column">
					<ConnectionError />
				</Stack>
			) }
			<Tabs.Root className="vp-dashboard-tabs" value={ activeTab } onValueChange={ onValueChange }>
				<DashboardTabs />
				{ TAB_VALUES.map( tab => (
					<Tabs.Panel key={ tab } value={ tab }>
						{ activeTab === tab ? children : null }
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
			{ /*
			 * Rendered from the shared chrome rather than a route so the
			 * first-run welcome greets the user on whichever tab they land on.
			 */ }
			<OnboardingModal />
		</AdminPage>
	);
}
