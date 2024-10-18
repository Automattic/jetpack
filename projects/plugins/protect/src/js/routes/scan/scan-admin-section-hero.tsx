import { Text, Status, useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import OnboardingPopover from '../../components/onboarding-popover';
import ScanNavigation from '../../components/scan-navigation';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import ScanningAdminSectionHero from './scanning-admin-section-hero';
import styles from './styles.module.scss';

const ScanAdminSectionHero: React.FC = () => {
	const { hasPlan } = usePlan();
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { data: status } = useScanStatusQuery();

	// Popover anchor
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	let lastCheckedLocalTimestamp = null;
	if ( lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();
	}

	if ( isScanInProgress( status ) ) {
		return <ScanningAdminSectionHero />;
	}

	if ( status.error ) {
		return (
			<ErrorAdminSectionHero
				baseErrorMessage={ __( 'We are having problems scanning your site.', 'jetpack-protect' ) }
				errorMessage={ status.errorMessage }
				errorCode={ status.errorCode }
			/>
		);
	}

	return (
		<AdminSectionHero
			main={
				<>
					<Status status={ 'active' } label={ __( 'Active', 'jetpack-protect' ) } />
					<AdminSectionHero.Heading showIcon>
						{ numThreats > 0
							? sprintf(
									/* translators: %s: Total number of threats/vulnerabilities */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats,
									hasPlan
										? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
										: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' )
							  )
							: sprintf(
									/* translators: %s: Pluralized type of threat/vulnerability */
									__( 'No %s found', 'jetpack-protect' ),
									hasPlan
										? __( 'threats', 'jetpack-protect' )
										: __(
												'vulnerabilities',
												'jetpack-protect',
												/* dummy arg to avoid bad minification */ 0
										  )
							  ) }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<>
							<Text ref={ setDailyScansPopoverAnchor }>
								{ lastCheckedLocalTimestamp ? (
									<>
										<span className={ styles[ 'subheading-content' ] }>
											{ dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp, false ) }
										</span>
										&nbsp;
										{ __( 'results', 'jetpack-protect' ) }
									</>
								) : (
									__( 'Most recent results', 'jetpack-protect' )
								) }
							</Text>
							{ ! hasPlan && (
								<OnboardingPopover
									id="free-daily-scans"
									position={ isSm ? 'bottom' : 'middle right' }
									anchor={ dailyScansPopoverAnchor }
								/>
							) }
						</>
					</AdminSectionHero.Subheading>
					<div className={ styles[ 'scan-navigation' ] }>
						<ScanNavigation />
					</div>
				</>
			}
		/>
	);
};

export default ScanAdminSectionHero;
