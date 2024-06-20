import { Container, Col, Text, Title, getIconBySlug, Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import useScanHistory from '../../hooks/use-scan-history';
import styles from './styles.module.scss';

const ScanHistorySummary = () => {
	const {
		numThreats,
		filter,
		allScanHistoryIsLoading,
		ignoredScanHistoryIsLoading,
		fixedScanHistoryIsLoading,
		hasRequiredPlan,
		toggleAllScanHistory,
		toggleIgnoredScanHistory,
		toggleFixedScanHistory,
		handleCurrentClick,
	} = useScanHistory();
	const Icon = getIconBySlug( 'protect' );

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							<div>
								{ sprintf(
									/* translators: %s: Filter applied */
									__( 'Scan history of %s threats', 'jetpack-protect' ),
									filter
								) }
							</div>
						</Title>
						{ numThreats > 0 && (
							<Text variant="headline-small" component="h1">
								{ sprintf(
									/* translators: %s: Total number of threats  */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats,
									numThreats === 1 ? 'threat' : 'threats'
								) }
							</Text>
						) }
					</div>
					{ hasRequiredPlan && (
						<>
							<Button
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								onClick={ handleCurrentClick }
							>
								{ __( 'Current', 'jetpack-protect' ) }
							</Button>
							<Button
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								onClick={ toggleAllScanHistory }
								disabled={ filter === 'all' }
								isLoading={ allScanHistoryIsLoading }
							>
								{ __( 'All', 'jetpack-protect' ) }
							</Button>
							<Button
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								onClick={ toggleIgnoredScanHistory }
								disabled={ filter === 'ignored' }
								isLoading={ ignoredScanHistoryIsLoading }
							>
								{ __( 'Ignored', 'jetpack-protect' ) }
							</Button>
							<Button
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								onClick={ toggleFixedScanHistory }
								disabled={ filter === 'fixed' }
								isLoading={ fixedScanHistoryIsLoading }
							>
								{ __( 'Fixed', 'jetpack-protect' ) }
							</Button>
						</>
					) }
				</div>
			</Col>
		</Container>
	);
};

export default ScanHistorySummary;
