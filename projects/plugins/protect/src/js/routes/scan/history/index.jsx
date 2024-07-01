import {
	AdminSectionHero,
	Container,
	Col,
	Title,
	getIconBySlug,
	H3,
	Text,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AdminPage from '../../../components/admin-page';
import ProtectCheck from '../../../components/protect-check-icon';
import ScanFooter from '../../../components/scan-footer';
import ScanSectionNav from '../../../components/scan-section-nav';
import PaidList from '../../../components/threats-list/paid-list';
import useAnalyticsTracks from '../../../hooks/use-analytics-tracks';
import { STORE_ID } from '../../../state/store';
import HistoryNavigation from './navigation';
import styles from './styles.module.scss';

const ScanHistoryPage = () => {
	// Track page view.
	useAnalyticsTracks( { pageViewEventName: 'protect_scan_history' } );

	const { filter = 'all' } = useParams();
	const Icon = getIconBySlug( 'protect' );

	const scanHistory = useSelect( select => select( STORE_ID ).getScanHistory() );

	const list = useMemo( () => {
		let threats = scanHistory?.threats || [];
		if ( 'fixed' === filter ) {
			threats = threats.filter( threat => threat.status === 'fixed' );
		}
		if ( 'ignored' === filter ) {
			threats = threats.filter( threat => threat.status === 'ignored' );
		}
		return camelize( threats );
	}, [ scanHistory, filter ] );

	return (
		<AdminPage>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
					<Col>
						<Container fluid>
							<Col>
								<div className={ styles.summary }>
									<div>
										<Title size="small" className={ styles.summary__title }>
											<Icon size={ 32 } className={ styles.summary__icon } />
											<div>{ __( 'History of previously active threats', 'jetpack-protect' ) }</div>
										</Title>
									</div>
									<div className={ styles.summary__actions }>
										<ScanSectionNav />
									</div>
								</div>
							</Col>
						</Container>
					</Col>
					<Col>
						<Container fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
							<Col lg={ 4 }>
								<HistoryNavigation />
							</Col>
							<Col lg={ 8 }>
								{ list.length > 0 ? (
									<PaidList list={ list } />
								) : (
									<div className={ styles.empty }>
										<ProtectCheck />
										<H3 weight="bold" mt={ 8 }>
											{ __( "Don't worry about a thing", 'jetpack-protect' ) }
										</H3>
										<Text>
											{ __(
												'So far, there are no threats in your scan history for the current filter.',
												'jetpack-protect'
											) }
										</Text>
									</div>
								) }
							</Col>
						</Container>
					</Col>
				</Container>
			</AdminSectionHero>
			<ScanFooter />
		</AdminPage>
	);
};

export default ScanHistoryPage;
