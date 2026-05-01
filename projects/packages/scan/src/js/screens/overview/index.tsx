import { Col, Container } from '@automattic/jetpack-components';
import { TabPanel } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
 * @return The tabbed overview screen.
 */
const OverviewScreen: FC = () => {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const tabParam = searchParams.get( 'tab' );
	const initialTab: ScanTab = isScanTab( tabParam ) ? tabParam : 'active';

	const handleSelect = useCallback(
		( next: string ) => {
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
		<Container horizontalSpacing={ 5 } horizontalGap={ 3 }>
			<Col>
				<TabPanel
					initialTabName={ initialTab }
					onSelect={ handleSelect }
					tabs={ [
						{
							name: 'active',
							title: __( 'Active threats', 'jetpack-scan-page' ),
						},
						{
							name: 'history',
							title: __( 'History', 'jetpack-scan-page' ),
						},
					] }
				>
					{ tab => ( tab.name === 'history' ? <ScanHistory /> : <ActiveThreats /> ) }
				</TabPanel>
			</Col>
		</Container>
	);
};

export default OverviewScreen;
