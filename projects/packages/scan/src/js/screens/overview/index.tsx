import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useSearchParams } from 'react-router';
import ActiveThreats from './active-threats';
import ScanHistory from './scan-history';
import './style.scss';
import type { FC } from 'react';

type ScanTab = 'active' | 'history';

const isScanTab = ( value: string | null ): value is ScanTab =>
	value === 'active' || value === 'history';

/**
 * Overview screen — tabbed Active threats / Scan history layout matching
 * Calypso's `client/dashboard/sites/scan/`. Tab selection is URL-synced
 * via `?tab=active|history` so deep-links and reloads round-trip.
 *
 * Single `Tabs.Root` keeps the active-tab indicator animated when the user
 * slides between tabs — the same pattern Newsletter's unified page uses
 * (see #48420 phase 3).
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
			{ /*
			   The wrapper carries the full-width bottom border + page padding;
			   the inner `Tabs.List` keeps its native `width: fit-content` so the
			   animated active-tab indicator slides smoothly between tabs.
			*/ }
			<div className="jetpack-scan-page__tabs-row">
				<Tabs.List variant="minimal">
					<Tabs.Tab value="active">{ __( 'Active threats', 'jetpack-scan-page' ) }</Tabs.Tab>
					<Tabs.Tab value="history">{ __( 'History', 'jetpack-scan-page' ) }</Tabs.Tab>
				</Tabs.List>
			</div>
			<div className="jetpack-scan-page__content">
				<Tabs.Panel value="active" focusable={ false }>
					<ActiveThreats />
				</Tabs.Panel>
				<Tabs.Panel value="history" focusable={ false }>
					<ScanHistory />
				</Tabs.Panel>
			</div>
		</Tabs.Root>
	);
};

export default OverviewScreen;
