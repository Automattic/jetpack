import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { useMemo } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import OnboardingPopover from '../../components/onboarding-popover';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ScanningAdminSectionHero from './scanning-admin-section-hero';
import styles from './styles.module.scss';

const ScanAdminSectionHero: React.FC = () => {
	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();
	const { setModal } = useModal();
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { data: status } = useScanStatusQuery();
	const { isThreatFixInProgress, isThreatFixStale } = useFixers();

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_scan_header_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	const numThreats = status.threats.length;

	// Popover anchor
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );
	const [ showAutoFixersPopoverAnchor, setShowAutoFixersPopoverAnchor ] = useState( null );

	// List of fixable threats that do not have a fix in progress
	const fixableList = useMemo( () => {
		return status.threats.filter( threat => {
			const threatId = typeof threat.id === 'string' ? parseInt( threat.id ) : threat.id;
			return (
				threat.fixable && ! isThreatFixInProgress( threatId ) && ! isThreatFixStale( threatId )
			);
		} );
	}, [ status.threats, isThreatFixInProgress, isThreatFixStale ] );

	const scanning = isScanInProgress( status );

	let lastCheckedLocalTimestamp = null;
	if ( status.lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( status.lastChecked + ' UTC' ).getTime();
	}

	let heading = __( "Don't worry about a thing", 'jetpack-protect' );
	if ( numThreats > 0 ) {
		if ( hasPlan ) {
			heading = sprintf(
				/* translators: %s: Total number of threats */
				_n( '%1$s active threat', '%1$s active threats', numThreats, 'jetpack-protect' ),
				numThreats
			);
		} else {
			heading = sprintf(
				/* translators: %s: Total number of vulnerabilities */
				_n(
					'%1$s active vulnerability',
					'%1$s active vulnerabilities',
					numThreats,
					'jetpack-protect'
				),
				numThreats
			);
		}
	}

	const handleShowAutoFixersClick = threatList => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'FIX_ALL_THREATS',
				props: { threatList },
			} );
		};
	};

	if ( scanning ) {
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
		<AdminSectionHero>
			<AdminSectionHero.Main>
				<Text mb={ 2 } ref={ setDailyScansPopoverAnchor }>
					{ lastCheckedLocalTimestamp
						? sprintf(
								// translators: %s: date and time of the last scan
								__( '%s results', 'jetpack-protect' ),
								dateI18n( 'F jS, g:i A', lastCheckedLocalTimestamp, false )
						  )
						: __( 'Most recent results', 'jetpack-protect' ) }
				</Text>
				<OnboardingPopover
					id={ hasPlan ? 'paid-daily-and-manual-scans' : 'free-daily-scans' }
					position={ isSm ? 'bottom' : 'middle right' }
					anchor={ dailyScansPopoverAnchor }
				/>
				<AdminSectionHero.Heading icon={ numThreats > 0 ? 'error' : 'success' }>
					{ heading }
				</AdminSectionHero.Heading>
				{ hasPlan ? (
					<Text>
						{ __(
							"We actively review your site's files line-by-line to identify threats and vulnerabilities.",
							'jetpack-protect'
						) }
					</Text>
				) : (
					<>
						<Text mb={ 4 }>
							{ sprintf(
								// translators: placeholder is the number of total vulnerabilities i.e. "22,000".
								__(
									'Every day we check your plugins, themes, and WordPress version against our %s listed vulnerabilities powered by WPScan, an Automattic brand.',
									'jetpack-protect'
								),
								totalVulnerabilitiesFormatted
							) }
						</Text>
						<Tooltip
							text={ __(
								'Upgrade Jetpack Protect to get access to advanced malware scanning with one-click fixes for most threats.',
								'jetpack-protect'
							) }
						>
							<Button onClick={ getScan }>
								{ __( 'Upgrade to unlock malware scanning', 'jetpack-protect' ) }
							</Button>
						</Tooltip>
					</>
				) }
				{ fixableList.length > 0 && (
					<>
						<div ref={ setShowAutoFixersPopoverAnchor }>
							<Button
								className={ styles[ 'auto-fixers' ] }
								onClick={ handleShowAutoFixersClick( fixableList ) }
							>
								{ sprintf(
									/* translators: Translates to Show auto fixers $s: Number of fixable threats. */
									__( 'Show auto fixers (%s)', 'jetpack-protect' ),
									fixableList.length
								) }
							</Button>
						</div>
						<OnboardingPopover
							id="paid-fix-all-threats"
							position={ isSm ? 'bottom right' : 'middle left' }
							anchor={ showAutoFixersPopoverAnchor }
						/>
					</>
				) }
			</AdminSectionHero.Main>
		</AdminSectionHero>
	);
};

export default ScanAdminSectionHero;
