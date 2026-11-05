import { Text } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import OnboardingPopover from '../../components/onboarding-popover';
import ScanNavigation from '../../components/scan-navigation';
import useScanStatusQuery, {
	isFirstScanNeeded,
	isScanInProgress,
} from '../../data/scan/use-scan-status-query';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import ScanningAdminSectionHero from './scanning-admin-section-hero';
import styles from './styles.module.scss';
import type { FC, ReactNode } from 'react';

const ScanAdminSectionHero: FC = () => {
	const { hasPlan } = usePlan();
	const isSm = useViewportMatch( 'small', '<' );
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { data: status } = useScanStatusQuery();
	const lastScanFailed = Boolean( status?.lastScanFailed );

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

	if ( isFirstScanNeeded( status ) ) {
		return (
			<AdminSectionHero
				main={
					<>
						<AdminSectionHero.Heading>
							{ __( 'Your site hasn’t been scanned yet', 'jetpack-protect' ) }
						</AdminSectionHero.Heading>
						<AdminSectionHero.Subheading>
							<Text>
								{ __(
									'Run a scan to check your site for malware and vulnerabilities.',
									'jetpack-protect'
								) }
							</Text>
						</AdminSectionHero.Subheading>
						<div className={ styles[ 'scan-navigation' ] }>
							<ScanNavigation />
						</div>
					</>
				}
			/>
		);
	}

	let heading: string = sprintf(
		/* translators: %s: the pluralized type of threat/vulnerability. */
		__( 'No %s found', 'jetpack-protect' ),
		hasPlan
			? __( 'threats', 'jetpack-protect' )
			: _x( 'vulnerabilities', 'Plural of vulnerability', 'jetpack-protect' )
	);
	let subheading: ReactNode = __( 'Most recent results', 'jetpack-protect' );
	if ( numThreats > 0 ) {
		heading = sprintf(
			/* translators: %1$s: the total number of threats/vulnerabilities, %2$s: the singular or plural form of "threat" or "vulnerability". */
			__( '%1$s %2$s found', 'jetpack-protect' ),
			numThreats.toString(),
			hasPlan
				? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
				: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' )
		);
	} else if ( lastScanFailed ) {
		heading = __( 'Your last scan didn’t complete', 'jetpack-protect' );
	}

	// A failed scan's time would pass for when the results are from.
	if ( lastScanFailed ) {
		subheading =
			numThreats > 0
				? __(
						'Your last scan didn’t complete, so these results are from an earlier scan.',
						'jetpack-protect'
					)
				: __(
						'We can’t confirm your site is free of threats until a scan finishes.',
						'jetpack-protect'
					);
	} else if ( lastCheckedLocalTimestamp ) {
		subheading = (
			<>
				<span className={ styles[ 'subheading-content' ] }>
					{ dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp, false ) }
				</span>
				&nbsp;
				{ __( 'results', 'jetpack-protect' ) }
			</>
		);
	}

	return (
		<AdminSectionHero
			main={
				<>
					<AdminSectionHero.StatusIndicator
						status="active"
						label={ __( 'Active', 'jetpack-protect' ) }
					/>
					<AdminSectionHero.Heading showIcon={ ! lastScanFailed }>
						{ heading }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<>
							<Text ref={ setDailyScansPopoverAnchor }>{ subheading }</Text>
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
