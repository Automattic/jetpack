import {
	Text,
	Button,
	useBreakpointMatch,
	ThreatsModal,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { type Threat } from '@automattic/jetpack-scan';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState, useMemo, useEffect } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import OnboardingPopover from '../../components/onboarding-popover';
import { QUERY_CREDENTIALS_KEY } from '../../constants';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useUnIgnoreThreatMutation from '../../data/scan/use-unignore-threat-mutation';
import useCredentialsQuery from '../../data/use-credentials-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import ScanningAdminSectionHero from './scanning-admin-section-hero';
import styles from './styles.module.scss';

const ScanAdminSectionHero: React.FC = ( { size = 'normal' }: { size?: 'normal' | 'large' } ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();

	const queryClient = useQueryClient();

	const { wafSupported, globalStats } = useWafData();
	const { data: status } = useScanStatusQuery();

	const { fixThreats, isThreatFixInProgress, isThreatFixStale } = useFixers();
	const ignoreThreatMutation = useIgnoreThreatMutation();
	const unignoreThreatMutation = useUnIgnoreThreatMutation();

	const { data: credentials, isLoading: credentialsIsFetching } = useCredentialsQuery();
	const { isUserConnected, hasConnectedOwner, userIsConnecting, handleConnectUser } = useConnection(
		{
			redirectUri: 'admin.php?page=jetpack-protect',
			from: 'scan',
			autoTrigger: false,
			skipUserConnection: false,
			skipPricingPage: true,
		}
	);

	// Popover anchor
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );
	const [ showAutoFixersPopoverAnchor, setShowAutoFixersPopoverAnchor ] = useState( null );

	const [ showModal, setShowModal ] = useState( false );

	const { siteSuffix, blogID } = window.jetpackProtectInitialState;

	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	const scanning = isScanInProgress( status );
	const numThreats = status.threats.length;

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

	// List of fixable threats that do not have a fix in progress
	const fixableList = useMemo( () => {
		return status.threats.filter( threat => {
			const threatId = typeof threat.id === 'string' ? parseInt( threat.id ) : threat.id;
			return (
				threat.fixable && ! isThreatFixInProgress( threatId ) && ! isThreatFixStale( threatId )
			);
		} );
	}, [ status.threats, isThreatFixInProgress, isThreatFixStale ] );

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_scan_header_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const handleFixClick = useCallback(
		async ( threats: Threat[] ) => {
			await fixThreats( [ threats[ 0 ].id as number ] );
		},
		[ fixThreats ]
	);

	const handleIgnoreClick = useCallback(
		async ( threats: Threat[] ) => {
			await ignoreThreatMutation.mutateAsync( threats[ 0 ].id );
		},
		[ ignoreThreatMutation ]
	);

	const handleUnignoreClick = useCallback(
		async ( threats: Threat[] ) => {
			await unignoreThreatMutation.mutateAsync( threats[ 0 ].id );
		},
		[ unignoreThreatMutation ]
	);

	const toggleModal = useCallback( () => {
		setShowModal( ! showModal );
	}, [ showModal ] );

	/**
	 * Poll credentials as long as the modal is open.
	 */
	useEffect( () => {
		if ( ! showModal ) {
			return;
		}
		const interval = setInterval( () => {
			if ( ! credentials || credentials.length === 0 ) {
				queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
			}
		}, 5_000 );

		return () => clearInterval( interval );
	}, [ showModal, queryClient, credentials ] );

	if ( scanning ) {
		return <ScanningAdminSectionHero size={ size } />;
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
			<AdminSectionHero.Main
				className={ clsx( styles[ 'hero-main' ], {
					[ styles[ 'hero-main--large' ] ]: size === 'large',
				} ) }
			>
				<Text className={ styles[ 'last-checked' ] } mb={ 2 } ref={ setDailyScansPopoverAnchor }>
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
					position={ isSm ? 'bottom right' : 'middle right' }
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
						<div className={ styles[ 'auto-fixers' ] } ref={ setShowAutoFixersPopoverAnchor }>
							<Button onClick={ toggleModal }>
								{ sprintf(
									/* translators: Translates to Show auto fixers $s: Number of fixable threats. */
									__( 'Show auto fixers (%s)', 'jetpack-protect' ),
									fixableList.length
								) }
							</Button>
						</div>
						{ showModal && (
							<ThreatsModal
								currentThreats={ fixableList }
								isSupportedEnvironment={ wafSupported }
								isUserConnected={ isUserConnected }
								hasConnectedOwner={ hasConnectedOwner }
								userIsConnecting={ userIsConnecting }
								handleConnectUser={ handleConnectUser }
								credentials={ credentials }
								credentialsIsFetching={ credentialsIsFetching }
								credentialsRedirectUrl={ getRedirectUrl( 'jetpack-settings-security-credentials', {
									site: String( blogID ?? siteSuffix ),
								} ) }
								handleFixThreatClick={ handleFixClick }
								handleIgnoreThreatClick={ handleIgnoreClick }
								handleUnignoreThreatClick={ handleUnignoreClick }
								onRequestClose={ toggleModal }
							/>
						) }
						<OnboardingPopover
							id="paid-fix-all-threats"
							position={ isSm ? 'bottom right' : 'middle right' }
							anchor={ showAutoFixersPopoverAnchor }
						/>
					</>
				) }
			</AdminSectionHero.Main>
		</AdminSectionHero>
	);
};

export default ScanAdminSectionHero;
