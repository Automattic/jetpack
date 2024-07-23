import { useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
<<<<<<< HEAD
import useScanHistory from '../../hooks/use-scan-history';
import { STORE_ID } from '../../state/store';
=======
import ScanSectionHeader from '../../routes/scan/scan-section-header';
>>>>>>> add/protect-threat-history-routes
import OnboardingPopover from '../onboarding-popover';

const Summary = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const {
		filter,
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
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	const renderScanOptions = () => (
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
				className={ styles[ 'summary__history-button' ] }
				onClick={ handleHistoryClick }
				isLoading={ allScanHistoryIsLoading }
			>
				{ __( 'History', 'jetpack-protect' ) }
			</Button>
		</>
	);

	const renderHistoryButtons = () => (
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
				className={ styles[ 'summary__history-button' ] }
				onClick={ toggleAllScanHistory }
				disabled={ filter === 'all' }
				isLoading={ allScanHistoryIsLoading }
			>
				{ __( 'All', 'jetpack-protect' ) }
			</Button>
			<Button
				variant="secondary"
				className={ styles[ 'summary__history-button' ] }
				onClick={ toggleIgnoredScanHistory }
				disabled={ filter === 'ignored' }
				isLoading={ ignoredScanHistoryIsLoading }
			>
				{ __( 'Ignored', 'jetpack-protect' ) }
			</Button>
			<Button
				variant="secondary"
				className={ styles[ 'summary__history-button' ] }
				onClick={ toggleFixedScanHistory }
				disabled={ filter === 'fixed' }
				isLoading={ fixedScanHistoryIsLoading }
			>
				{ __( 'Fixed', 'jetpack-protect' ) }
			</Button>
		</>
	);

	return (
<<<<<<< HEAD
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
					{ hasRequiredPlan && (
						<>
							{ ! viewingScanHistory && numThreats === 0 && renderScanOptions() }
							{ viewingScanHistory && renderHistoryButtons() }
						</>
=======
		<ScanSectionHeader
			title={
				numThreats > 0
					? sprintf(
							/* translators: %s: Total number of threats  */
							__( '%1$s %2$s found', 'jetpack-protect' ),
							numThreats,
							numThreats === 1 ? 'threat' : 'threats'
					  )
					: undefined
			}
			subtitle={
				<>
					<div ref={ setDailyScansPopoverAnchor }>
						{ sprintf(
							/* translators: %s: Latest check date  */
							__( 'Latest results as of %s', 'jetpack-protect' ),
							dateI18n( 'F jS', lastChecked )
						) }
					</div>
					{ ! hasRequiredPlan && (
						<OnboardingPopover
							id="free-daily-scans"
							position={ isSm ? 'bottom' : 'middle right' }
							anchor={ dailyScansPopoverAnchor }
						/>
>>>>>>> add/protect-threat-history-routes
					) }
				</>
			}
		/>
	);
};

export default Summary;
