import {
	siteScanHistoryQuery,
	siteScanQuery,
} from '@automattic/jetpack-scan-page/src/js/data/query-options';
import MockBanner from '@automattic/jetpack-scan-page/src/js/mock-banner';
import ActiveThreats from '@automattic/jetpack-scan-page/src/js/screens/overview/active-threats';
import ScanHistory from '@automattic/jetpack-scan-page/src/js/screens/overview/scan-history';
import { useQuery } from '@tanstack/react-query';
import { Button, Spinner } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import SiteStatus from './site-status';
import ThreatList from './threat-list';
import type { FC } from 'react';

/**
 * Whether `&threat-view=dataviews` asks for packages/scan's DataViews tables instead of the list.
 *
 * @return True for the DataViews variant.
 */
export const useDataViewsVariant = (): boolean => {
	try {
		return new URLSearchParams( window.location.search ).get( 'threat-view' ) === 'dataviews';
	} catch {
		return false;
	}
};

// The DataViews variant offers only the list layout.
const LIST_ONLY: 'list'[] = [ 'list' ];

/**
 * Plan notice shown on the Scan tabs when the site has no Scan.
 *
 * @return The notice.
 */
const NoScanNotice: FC = () => (
	<Notice.Root intent="info">
		<Notice.Description>
			{ __(
				'Scan is not included in your plan. Upgrade to scan your site daily for malware and vulnerabilities.',
				'jetpack'
			) }
		</Notice.Description>
	</Notice.Root>
);

/**
 * Scanner tab: the site status, then the active threats.
 *
 * @return The Scanner tab.
 */
export const ScannerTab: FC = () => {
	const { data, isLoading } = useQuery( { ...siteScanQuery(), retry: false } );
	const dataViews = useDataViewsVariant();

	if ( isLoading ) {
		return <Spinner />;
	}
	if ( ! data || data.state === 'unavailable' ) {
		return <NoScanNotice />;
	}

	return (
		<div className="jp-protect-dashboard__boxes">
			<MockBanner />
			<SiteStatus />
			{ dataViews && <ActiveThreats layouts={ LIST_ONLY } /> }
			{ ! dataViews && data.threats?.length > 0 && <ThreatList threats={ data.threats } showFix /> }
		</div>
	);
};

type HistoryFilter = 'all' | 'fixed' | 'ignored';

/**
 * History tab: previously active threats, filterable by how they were resolved.
 *
 * @return The History tab.
 */
export const HistoryTab: FC = () => {
	const scan = useQuery( { ...siteScanQuery(), retry: false } );
	const hasScan = !! scan.data && scan.data.state !== 'unavailable';
	const { data, isLoading } = useQuery( { ...siteScanHistoryQuery(), enabled: hasScan } );
	const dataViews = useDataViewsVariant();
	const [ filter, setFilter ] = useState< HistoryFilter >( 'all' );
	const showAll = useCallback( () => setFilter( 'all' ), [] );
	const showFixed = useCallback( () => setFilter( 'fixed' ), [] );
	const showIgnored = useCallback( () => setFilter( 'ignored' ), [] );

	if ( scan.isLoading || ( hasScan && isLoading ) ) {
		return <Spinner />;
	}
	if ( ! hasScan ) {
		return <NoScanNotice />;
	}

	// DataViews brings its own search and status filters.
	if ( dataViews ) {
		return (
			<div className="jp-protect-dashboard__boxes">
				<MockBanner />
				<ScanHistory layouts={ LIST_ONLY } />
			</div>
		);
	}

	const threats = ( data?.threats ?? [] ).filter(
		threat => filter === 'all' || threat.status === filter
	);

	return (
		<div className="jp-protect-dashboard__boxes">
			<MockBanner />
			<p className="jp-protect-history__intro">
				{ __(
					'The scanning history contains a record of all previously active threats on your site.',
					'jetpack'
				) }
			</p>
			<div
				className="jp-protect-history__filters"
				role="group"
				aria-label={ __( 'Filter', 'jetpack' ) }
			>
				<Button variant={ filter === 'all' ? 'primary' : 'secondary' } onClick={ showAll }>
					{ __( 'All', 'jetpack' ) }
				</Button>
				<Button variant={ filter === 'fixed' ? 'primary' : 'secondary' } onClick={ showFixed }>
					{ __( 'Fixed', 'jetpack' ) }
				</Button>
				<Button variant={ filter === 'ignored' ? 'primary' : 'secondary' } onClick={ showIgnored }>
					{ __( 'Ignored', 'jetpack' ) }
				</Button>
			</div>
			{ threats.length > 0 ? (
				<ThreatList threats={ threats } />
			) : (
				<p className="jp-protect-history__empty">{ __( 'No threats to show.', 'jetpack' ) }</p>
			) }
		</div>
	);
};
