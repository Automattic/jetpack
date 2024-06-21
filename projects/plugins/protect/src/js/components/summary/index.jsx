import {
	Container,
	Col,
	Text,
	Title,
	getIconBySlug,
	Button,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import useScanHistory from '../../hooks/use-scan-history';
import { STORE_ID } from '../../state/store';
import OnboardingPopover from '../onboarding-popover';
import styles from './styles.module.scss';

const Summary = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { numThreats: currentNumThreats, lastChecked, hasRequiredPlan } = useProtectData();
	const {
		filter,
		numThreats: scanHistoryNumThreats,
		viewingScanHistory,
		allScanHistoryIsLoading,
		ignoredScanHistoryIsLoading,
		fixedScanHistoryIsLoading,
		toggleAllScanHistory,
		toggleIgnoredScanHistory,
		toggleFixedScanHistory,
		handleHistoryClick,
		handleCurrentClick,
	} = useScanHistory();
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );
	const { scan } = useDispatch( STORE_ID );
	const Icon = getIconBySlug( 'protect' );

	const numThreats = viewingScanHistory ? scanHistoryNumThreats : currentNumThreats;

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );
	const [ dailyAndManualScansPopoverAnchor, setDailyAndManualScansPopoverAnchor ] =
		useState( null );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							{ ! viewingScanHistory ? (
								<div ref={ setDailyScansPopoverAnchor }>
									{ sprintf(
										/* translators: %s: Latest check date  */
										__( 'Latest results as of %s', 'jetpack-protect' ),
										dateI18n( 'F jS', lastChecked )
									) }
								</div>
							) : (
								<div>
									{ sprintf(
										/* translators: %s: Filter applied */
										__( 'Scan history of %s threats', 'jetpack-protect' ),
										filter
									) }
								</div>
							) }
							{ ! hasRequiredPlan && (
								<OnboardingPopover
									id="free-daily-scans"
									position={ isSm ? 'bottom' : 'middle right' }
									anchor={ dailyScansPopoverAnchor }
								/>
							) }
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
					{ hasRequiredPlan /*&& numThreats === 0 TODO: figure this bit out... */ && (
						<>
							{ ! viewingScanHistory ? (
								<>
									<Button
										ref={ setDailyAndManualScansPopoverAnchor }
										variant="secondary"
										className={ styles[ 'summary__scan-button' ] }
										isLoading={ scanIsEnqueuing }
										onClick={ handleScanClick() }
									>
										{ __( 'Scan now', 'jetpack-protect' ) }
									</Button>
									<OnboardingPopover
										id="paid-daily-and-manual-scans"
										position="middle left"
										anchor={ dailyAndManualScansPopoverAnchor }
									/>
									<Button
										variant="secondary"
										className={ styles[ 'summary__scan-button' ] }
										onClick={ handleHistoryClick }
										isLoading={ allScanHistoryIsLoading }
									>
										{ __( 'History', 'jetpack-protect' ) }
									</Button>
								</>
							) : (
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
						</>
					) }
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
