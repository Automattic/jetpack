import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import { useMemo } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import OnboardingPopover from '../../components/onboarding-popover';
import useThreatsList from '../../components/threats-list/use-threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import ScanningAdminSectionHero from './scanning-admin-section-hero';
import styles from './styles.module.scss';

const ScanAdminSectionHero: React.FC = () => {
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { hasPlan } = usePlan();
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { data: status } = useScanStatusQuery();
	const { list } = useThreatsList();
	const { isThreatFixInProgress, isThreatFixStale } = useFixers();
	const { setModal } = useModal();

	// Popover anchor
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );
	const [ showAutoFixersPopoverAnchor, setShowAutoFixersPopoverAnchor ] = useState( null );

	// List of fixable threats that do not have a fix in progress
	const fixableList = useMemo( () => {
		return list.filter( threat => {
			const threatId = parseInt( threat.id );
			return (
				threat.fixable && ! isThreatFixInProgress( threatId ) && ! isThreatFixStale( threatId )
			);
		} );
	}, [ list, isThreatFixInProgress, isThreatFixStale ] );

	const scanning = isScanInProgress( status );

	let lastCheckedLocalTimestamp = null;
	if ( lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();
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
		<AdminSectionHero
			main={
				<>
					<Text ref={ setDailyScansPopoverAnchor }>
						{ lastCheckedLocalTimestamp
							? sprintf(
									// translators: %s: date and time of the last scan
									__( '%s results', 'jetpack-protect' ),
									dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp, false )
							  )
							: __( 'Most recent results', 'jetpack-protect' ) }
					</Text>
					{ ! hasPlan && (
						<OnboardingPopover
							id="free-daily-scans"
							position={ isSm ? 'bottom' : 'middle right' }
							anchor={ dailyScansPopoverAnchor }
						/>
					) }
					<AdminSectionHero.Heading showIcon>
						{ numThreats > 0
							? sprintf(
									/* translators: %s: Total number of threats/vulnerabilities */
									__( '%1$s active %2$s', 'jetpack-protect' ),
									numThreats,
									hasPlan
										? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
										: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' )
							  )
							: sprintf(
									/* translators: %s: Pluralized type of threat/vulnerability */
									__( 'No active %s', 'jetpack-protect' ),
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
							<Text className={ styles[ 'subheading-text' ] }>
								{ __(
									"We actively review your site's files line-by-line to identify threats and vulnerabilities.",
									'jetpack-protect'
								) }
							</Text>
							{ fixableList.length > 0 && (
								<>
									<Button
										className={ styles[ 'auto-fixers' ] }
										ref={ setShowAutoFixersPopoverAnchor }
										variant="primary"
										weight="regular"
										onClick={ handleShowAutoFixersClick( fixableList ) }
									>
										{ sprintf(
											/* translators: Translates to Show auto fixers $s: Number of fixable threats. */
											__( 'Show auto fixers (%s)', 'jetpack-protect' ),
											fixableList.length
										) }
									</Button>
									{ ! scanning && (
										<OnboardingPopover
											id="paid-fix-all-threats"
											position={ isSm ? 'bottom right' : 'middle left' }
											anchor={ showAutoFixersPopoverAnchor }
										/>
									) }
								</>
							) }
						</>
					</AdminSectionHero.Subheading>
				</>
			}
		/>
	);
};

export default ScanAdminSectionHero;
