import AdminPage from '@automattic/jetpack-components/admin-page';
import { siteScanQuery } from '@automattic/jetpack-scan-page/src/js/data/query-options';
import { HeaderActionsProvider } from '@automattic/jetpack-scan-page/src/js/header-actions-context';
import ScanNowButton from '@automattic/jetpack-scan-page/src/js/screens/overview/scan-now-button';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { readScan } from './data';
import Overview from './overview';
import { HistoryTab, ScannerTab, useDataViewsVariant } from './scan-tab';
import type { FC } from 'react';

const TABS = [ 'overview', 'scanner', 'history' ] as const;
export type ProtectTab = ( typeof TABS )[ number ];

/**
 * Normalize the `?tab=` value.
 *
 * @param tab - Raw query value.
 * @return A known tab, defaulting to the overview.
 */
export const toTab = ( tab: unknown ): ProtectTab =>
	TABS.includes( tab as ProtectTab ) ? ( tab as ProtectTab ) : 'overview';

type Props = {
	activeTab: ProtectTab;
};

const Page: FC< Props > = ( { activeTab } ) => {
	const navigate = useNavigate();
	// The DataViews variant of Scanner and History spans the full width.
	const wide = useDataViewsVariant() && activeTab !== 'overview';
	const { data: scan } = useQuery( { ...siteScanQuery(), retry: false } );
	const canScan = !! scan && scan.state !== 'unavailable';
	const { scanning } = readScan( scan );

	const goTo = useCallback(
		( next: string | null ) => {
			if ( ! next ) {
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: next === 'overview' ? undefined : next,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	return (
		<AdminPage
			title={ 'Protect' /* product name; not translated */ }
			subTitle={ __( 'Scan for threats and manage your site’s security features.', 'jetpack' ) }
			// One primary action on every tab; the Scan list's own header actions are not shown.
			actions={ canScan ? <ScanNowButton variant="primary" disabled={ scanning } /> : null }
		>
			<Tabs.Root value={ activeTab } onValueChange={ goTo }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack' ) }</Tabs.Tab>
						<Tabs.Tab value="scanner">{ __( 'Scanner', 'jetpack' ) }</Tabs.Tab>
						<Tabs.Tab value="history">{ __( 'History', 'jetpack' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className={ `jp-protect-dashboard__panel${ wide ? ' is-wide' : '' }` }>
					<Tabs.Panel value="overview">
						{ activeTab === 'overview' && <Overview onNavigate={ goTo } /> }
					</Tabs.Panel>
					<Tabs.Panel value="scanner">{ activeTab === 'scanner' && <ScannerTab /> }</Tabs.Panel>
					<Tabs.Panel value="history">{ activeTab === 'history' && <HistoryTab /> }</Tabs.Panel>
				</div>
			</Tabs.Root>
		</AdminPage>
	);
};

/**
 * The Protect dashboard: an Overview of every security feature, plus the Scanner and its History.
 *
 * @param props           - Component props.
 * @param props.activeTab - The tab from `?tab=`.
 * @return The dashboard.
 */
const ProtectDashboard: FC< Props > = ( { activeTab } ) => (
	<HeaderActionsProvider>
		<Page activeTab={ activeTab } />
	</HeaderActionsProvider>
);

export default ProtectDashboard;
