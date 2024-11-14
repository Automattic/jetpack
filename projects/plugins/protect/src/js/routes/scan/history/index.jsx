import { AdminSection, Container, Col, H3, Text, Title } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AdminPage from '../../../components/admin-page';
import ProtectCheck from '../../../components/protect-check-icon';
import ThreatsNavigation from '../../../components/threats-list/navigation';
import PaidList from '../../../components/threats-list/paid-list';
import useThreatsList from '../../../components/threats-list/use-threats-list';
import useAnalyticsTracks from '../../../hooks/use-analytics-tracks';
import usePlan from '../../../hooks/use-plan';
import useProtectData from '../../../hooks/use-protect-data';
import ScanFooter from '../scan-footer';
import HistoryAdminSectionHero from './history-admin-section-hero';
import StatusFilters from './status-filters';
import styles from './styles.module.scss';

const ScanHistoryRoute = () => {
	// Track page view.
	useAnalyticsTracks( { pageViewEventName: 'protect_scan_history' } );

	const { hasPlan } = usePlan();
	const { filter = 'all' } = useParams();

	const { item, list, selected, setSelected } = useThreatsList( {
		source: 'history',
		status: filter,
	} );

	const { counts, error } = useProtectData( {
		sourceType: 'history',
		filter: { status: filter },
	} );
	const { threats: numAllThreats } = counts.all;

	const { counts: fixedCounts } = useProtectData( {
		sourceType: 'history',
		filter: { status: 'fixed', key: selected },
	} );
	const { threats: numFixed } = fixedCounts.current;

	const { counts: ignoredCounts } = useProtectData( {
		sourceType: 'history',
		filter: { status: 'ignored', key: selected },
	} );
	const { threats: numIgnored } = ignoredCounts.current;

	/**
	 * Get the title for the threats list based on the selected filters and the amount of threats.
	 */
	const getTitle = useCallback( () => {
		switch ( selected ) {
			case 'all':
				if ( list.length === 1 ) {
					switch ( filter ) {
						case 'fixed':
							return __( 'All fixed threats', 'jetpack-protect' );
						case 'ignored':
							return __(
								'All ignored threats',
								'jetpack-protect',
								/** dummy arg to avoid bad minification */ 0
							);
						default:
							return __( 'All threats', 'jetpack-protect' );
					}
				}
				switch ( filter ) {
					case 'fixed':
						return sprintf(
							/* translators: placeholder is the amount of fixed threats found on the site. */
							__( 'All %s fixed threats', 'jetpack-protect' ),
							list.length
						);
					case 'ignored':
						return sprintf(
							/* translators: placeholder is the amount of ignored threats found on the site. */
							__( 'All %s ignored threats', 'jetpack-protect' ),
							list.length
						);
					default:
						return sprintf(
							/* translators: placeholder is the amount of threats found on the site. */
							__( 'All %s threats', 'jetpack-protect' ),
							list.length
						);
				}
			case 'core':
				switch ( filter ) {
					case 'fixed':
						return sprintf(
							/* translators: placeholder is the amount of fixed WordPress threats found on the site. */
							_n(
								'%1$s fixed WordPress threat',
								'%1$s fixed WordPress threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					case 'ignored':
						return sprintf(
							/* translators: placeholder is the amount of ignored WordPress threats found on the site. */
							_n(
								'%1$s ignored WordPress threat',
								'%1$s ignored WordPress threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					default:
						return sprintf(
							/* translators: placeholder is the amount of WordPress threats found on the site. */
							_n(
								'%1$s WordPress threat',
								'%1$s WordPress threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
				}
			case 'files':
				switch ( filter ) {
					case 'fixed':
						return sprintf(
							/* translators: placeholder is the amount of fixed file threats found on the site. */
							_n(
								'%1$s fixed file threat',
								'%1$s fixed file threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					case 'ignored':
						return sprintf(
							/* translators: placeholder is the amount of ignored file threats found on the site. */
							_n(
								'%1$s ignored file threat',
								'%1$s ignored file threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					default:
						return sprintf(
							/* translators: placeholder is the amount of file threats found on the site. */
							_n( '%1$s file threat', '%1$s file threats', list.length, 'jetpack-protect' ),
							list.length
						);
				}
			case 'database':
				switch ( filter ) {
					case 'fixed':
						return sprintf(
							/* translators: placeholder is the amount of fixed database threats found on the site. */
							_n(
								'%1$s fixed database threat',
								'%1$s fixed database threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					case 'ignored':
						return sprintf(
							/* translators: placeholder is the amount of ignored database threats found on the site. */
							_n(
								'%1$s ignored database threat',
								'%1$s ignored database threats',
								list.length,
								'jetpack-protect'
							),
							list.length
						);
					default:
						return sprintf(
							/* translators: placeholder is the amount of database threats found on the site. */
							_n( '%1$s database threat', '%1$s database threats', list.length, 'jetpack-protect' ),
							list.length
						);
				}
			default:
				switch ( filter ) {
					case 'fixed':
						return sprintf(
							/* translators: Translates to "123 fixed threats in Example Plugin (1.2.3)" */
							_n(
								'%1$s fixed threat in %2$s %3$s',
								'%1$s fixed threats in %2$s %3$s',
								list.length,
								'jetpack-protect'
							),
							list.length,
							item?.name,
							item?.version
						);
					case 'ignored':
						return sprintf(
							/* translators: Translates to "123 ignored threats in Example Plugin (1.2.3)" */
							_n(
								'%1$s ignored threat in %2$s %3$s',
								'%1$s ignored threats in %2$s %3$s',
								list.length,
								'jetpack-protect'
							),
							list.length,
							item?.name,
							item?.version
						);
					default:
						return sprintf(
							/* translators: Translates to "123 threats in Example Plugin (1.2.3)" */
							_n(
								'%1$s threat in %2$s %3$s',
								'%1$s threats in %2$s %3$s',
								list.length,
								'jetpack-protect'
							),
							list.length,
							item?.name,
							item?.version
						);
				}
		}
	}, [ selected, list.length, filter, item?.name, item?.version ] );

	// Threat history is only available for paid plans.
	if ( ! hasPlan ) {
		return <Navigate to="/scan" />;
	}

	// Remove the filter if there are no threats to show.
	if ( list.length === 0 && filter !== 'all' ) {
		return <Navigate to="/scan/history" />;
	}

	return (
		<AdminPage>
			<HistoryAdminSectionHero />
			{ ( ! error || numAllThreats ) && (
				<AdminSection>
					<Container horizontalSpacing={ 7 } horizontalGap={ 4 }>
						<Col>
							<Container fluid horizontalSpacing={ 0 } horizontalGap={ 3 }>
								<Col lg={ 4 }>
									<ThreatsNavigation
										selected={ selected }
										onSelect={ setSelected }
										sourceType="history"
										statusFilter={ filter }
									/>
								</Col>
								<Col lg={ 8 }>
									{ list.length > 0 ? (
										<div>
											<div className={ styles[ 'list-header' ] }>
												<Title className={ styles[ 'list-title' ] }>{ getTitle() }</Title>
												<div className={ styles[ 'list-header__controls' ] }>
													<StatusFilters numFixed={ numFixed } numIgnored={ numIgnored } />
												</div>
											</div>
											<PaidList list={ list } hideAutoFixColumn={ true } />
										</div>
									) : (
										<>
											<div className={ styles[ 'list-header' ] }>
												<div className={ styles[ 'list-header__controls' ] }>
													<StatusFilters />
												</div>
											</div>
											<div className={ styles.empty }>
												<ProtectCheck />
												<H3 weight="bold" mt={ 8 }>
													{ __( "Don't worry about a thing", 'jetpack-protect' ) }
												</H3>
												<Text mb={ 4 }>
													{ sprintf(
														/* translators: %s: Filter type */
														__( 'There are no%sthreats in your scan history.', 'jetpack-protect' ),
														'all' === filter ? ' ' : ` ${ filter } `
													) }
												</Text>
											</div>
										</>
									) }
								</Col>
							</Container>
						</Col>
					</Container>
				</AdminSection>
			) }
			<ScanFooter />
		</AdminPage>
	);
};

export default ScanHistoryRoute;
