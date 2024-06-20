import { Container, Col, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useScanHistory from '../../hooks/use-scan-history';
import EmptyList from './empty';
import FreeList from './free-list';
import ThreatsNavigation from './navigation';
import PaidList from './paid-list';
import styles from './styles.module.scss';
import useScanHistoryThreatsList from './use-scan-history-threats-list';

const ScanHistoryThreatsList = () => {
	const { hasRequiredPlan } = useScanHistory();
	const { item, list, selected, setSelected } = useScanHistoryThreatsList();

	const getTitle = useCallback( () => {
		switch ( selected ) {
			case 'all':
				if ( list.length === 1 ) {
					return __( 'All threats', 'jetpack-protect' );
				}
				return sprintf(
					/* translators: placeholder is the amount of threats found on the site. */
					__( 'All %s threats', 'jetpack-protect' ),
					list.length
				);
			case 'files':
				return sprintf(
					/* translators: placeholder is the amount of file threats found on the site. */
					__( '%1$s file %2$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats'
				);
			case 'database':
				return sprintf(
					/* translators: placeholder is the amount of database threats found on the site. */
					__( '%1$s database %2$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats'
				);
			default:
				return sprintf(
					/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
					__( '%1$s %2$s in your %3$s %4$s', 'jetpack-protect' ),
					list.length,
					list.length === 1 ? 'threat' : 'threats',
					item?.name,
					item?.version
				);
		}
	}, [ selected, list, item ] );

	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
			<Col lg={ 4 }>
				<ThreatsNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<div className={ styles[ 'list-header' ] }>
							<Title className={ styles[ 'list-title' ] }>{ getTitle() }</Title>
						</div>
						{ hasRequiredPlan ? <PaidList list={ list } /> : <FreeList list={ list } /> }
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default ScanHistoryThreatsList;
