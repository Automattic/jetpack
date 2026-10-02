import { siteScanQuery } from '@automattic/jetpack-scan-page/src/js/data/query-options';
import MockBanner from '@automattic/jetpack-scan-page/src/js/mock-banner';
import ActiveThreats from '@automattic/jetpack-scan-page/src/js/screens/overview/active-threats';
import ScanHistory from '@automattic/jetpack-scan-page/src/js/screens/overview/scan-history';
import { useQuery } from '@tanstack/react-query';
import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { FC } from 'react';

/**
 * Scan tab: packages/scan's threat list and history, once the site has Scan.
 *
 * @return The Scan tab.
 */
const ScanTab: FC = () => {
	const { data, isLoading } = useQuery( siteScanQuery() );

	if ( isLoading ) {
		return <Spinner />;
	}

	// The reused list renders "You're set up" for an unavailable scan, so intercept it.
	if ( ! data || data.state === 'unavailable' ) {
		return (
			<Notice status="info" isDismissible={ false }>
				{ __(
					'Scan is not included in your plan. Upgrade to scan your site daily for malware and vulnerabilities.',
					'jetpack'
				) }
			</Notice>
		);
	}

	return (
		<>
			<MockBanner />
			<ActiveThreats />
			<h2 className="jp-protect-dashboard__section-title">{ __( 'Scan history', 'jetpack' ) }</h2>
			<ScanHistory />
		</>
	);
};

export default ScanTab;
