/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { useFreeTier } from '../../hooks/use-free-tier';
import DashboardTabs, { TAB_PATHS, useDashboardTabOrder, type DashboardTab } from '../dashboard-tabs';
import OnboardingModal, { hasSeenOnboarding } from '../onboarding-modal';
import './style.scss';
import type { ReactNode } from 'react';

type Props = {
	activeTab: DashboardTab;
	children: ReactNode;
	actions?: ReactNode;
	hideFooter?: boolean;
};

let hasHandledFirstRunUploadRedirect = false;

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
	const { videoCount } = useFreeTier();
	const tabs = useDashboardTabOrder();
	const hasCheckedFirstRunUploadRedirect = useRef( false );

	const onValueChange = useCallback(
		( next: string ) => {
			const target = TAB_PATHS[ next as DashboardTab ];
			if ( target ) {
				navigate( { href: target } );
			}
		},
		[ navigate ]
	);

	useEffect( () => {
		if ( hasHandledFirstRunUploadRedirect || hasCheckedFirstRunUploadRedirect.current ) {
			return;
		}

		hasHandledFirstRunUploadRedirect = true;
		hasCheckedFirstRunUploadRedirect.current = true;

		if ( activeTab === 'library' && videoCount === 0 && ! hasSeenOnboarding() ) {
			navigate( { href: TAB_PATHS.upload } );
		}
	}, [ activeTab, navigate, videoCount ] );

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
			<Tabs.Root className="vp-dashboard-tabs" value={ activeTab } onValueChange={ onValueChange }>
				<DashboardTabs tabs={ tabs } />
				{ tabs.map( tab => (
					<Tabs.Panel key={ tab } value={ tab }>
						{ activeTab === tab ? children : null }
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
			<OnboardingModal />
		</AdminPage>
	);
}
