import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useSearchParams } from 'react-router';
import ActiveThreats from './active-threats';
import ScanHistory from './scan-history';
import type { FC } from 'react';

type ScanTab = 'active' | 'history';

const isScanTab = ( value: string | null ): value is ScanTab =>
	value === 'active' || value === 'history';

/**
 * Overview screen — tabbed Active threats / Scan history layout matching
 * Calypso's `client/dashboard/sites/scan/`. Tab selection is URL-synced
 * via `?tab=active|history` so deep-links and reloads round-trip.
 *
 * The tabs strip is wrapped in a `.jp-admin-page-tabs` div so the
 * `jetpack-admin-page-layout` mixin (from `@automattic/jetpack-base-styles`)
 * pins it to the top of the scrollable middle, aligns the tab buttons
 * with the page header inset, and stretches the hairline across the
 * full column width — same convention Activity Log + Newsletter use.
 *
 * @return The tabbed overview screen.
 */
const OverviewScreen: FC = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const tabParam = searchParams.get( 'tab' );
	const activeTab: ScanTab = isScanTab( tabParam ) ? tabParam : 'active';

	const handleTabChange = useCallback(
		( next: string | null ) => {
			if ( ! isScanTab( next ) ) {
				return;
			}
			setSearchParams(
				prev => {
					const updated = new URLSearchParams( prev );
					if ( next === 'active' ) {
						updated.delete( 'tab' );
					} else {
						updated.set( 'tab', next );
					}
					return updated;
				},
				{ replace: true }
			);
		},
		[ setSearchParams ]
	);

	return (
		<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
			<div className="jp-admin-page-tabs">
				<Tabs.List variant="minimal">
					<Tabs.Tab value="active">{ __( 'Active threats', 'jetpack-scan-page' ) }</Tabs.Tab>
					<Tabs.Tab value="history">{ __( 'History', 'jetpack-scan-page' ) }</Tabs.Tab>
				</Tabs.List>
			</div>
			<Tabs.Panel value="active" focusable={ false }>
				<ActiveThreats />
			</Tabs.Panel>
			<Tabs.Panel value="history" focusable={ false }>
				<ScanHistory />
			</Tabs.Panel>
		</Tabs.Root>
	);
};

export default OverviewScreen;
