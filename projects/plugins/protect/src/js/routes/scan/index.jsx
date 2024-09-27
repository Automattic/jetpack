import {
	AdminSection,
	Container,
	Col,
	useBreakpointMatch,
	H3,
	Text,
	getIconBySlug,
} from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import AdminPage from '../../components/admin-page';
import OnboardingPopover from '../../components/onboarding-popover';
import ScanFooter from '../../components/scan-footer';
import ScanHeader from '../../components/scan-header';
import ThreatsList from '../../components/threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import onboardingSteps from './onboarding-steps';
import styles from './styles.module.scss';

const ScanPage = () => {
	const { hasPlan } = usePlan();
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const [ isSm ] = useBreakpointMatch( 'sm' );

	// Convert the last checked UTC date to a local timestamp
	const lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();

	let currentScanStatus;
	if ( status.error ) {
		currentScanStatus = 'error';
	} else if ( ! lastChecked ) {
		currentScanStatus = 'in_progress';
	} else {
		currentScanStatus = 'active';
	}

	// Track view for Protect admin page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_admin',
		pageViewEventProperties: {
			check_status: currentScanStatus,
			has_plan: hasPlan,
		},
	} );

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	const Icon = getIconBySlug( 'protect' );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<ScanHeader
					isScanning={ isScanInProgress( status ) }
					currentProgress={ status.currentProgress }
					baseErrorMessage={ __( 'We are having problems scanning your site.', 'jetpack-protect' ) }
					error={ status.error }
					errorMessage={ status.errorMessage }
					errorCode={ status.errorCode }
					summary={
						<>
							<div ref={ setDailyScansPopoverAnchor }>
								<Col>
									<H3 className={ styles.heading } mb={ 2 } mt={ 2 }>
										{ numThreats > 0
											? sprintf(
													/* translators: %s: Total number of threats  */
													__( '%1$s %2$s found', 'jetpack-protect' ),
													numThreats,
													numThreats === 1 ? 'threat' : 'threats'
											  )
											: __( 'No threats found', 'jetpack-protect' ) }
										<Icon className={ styles[ 'heading-icon' ] } size={ 32 } />
									</H3>
									<Text>
										{ sprintf(
											/* translators: %s: Latest check date  */
											__( '%s results', 'jetpack-protect' ),
											dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp )
										) }
									</Text>
								</Col>
							</div>
							{ ! hasPlan && (
								<OnboardingPopover
									id="free-daily-scans"
									position={ isSm ? 'bottom' : 'middle right' }
									anchor={ dailyScansPopoverAnchor }
								/>
							) }
						</>
					}
				/>
				<AdminSection>
					<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
						<Col>
							<ThreatsList />
						</Col>
					</Container>
				</AdminSection>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
