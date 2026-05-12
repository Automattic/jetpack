import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Text as UIText } from '@wordpress/ui';
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
import type { FC } from 'react';

const ScanAdminSectionHero: FC = () => {
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
					<UIText
						variant="body-sm"
						style={ {
							alignItems: 'center',
							color: 'var(--jp-green-50)',
							display: 'inline-flex',
							fontWeight: 600,
							lineHeight: 1.666,
							whiteSpace: 'nowrap',
						} }
					>
						<span
							style={ {
								backgroundColor: 'var(--jp-green-50)',
								borderRadius: '50%',
								flexShrink: 0,
								height: '0.666em',
								marginRight: '4px',
								width: '0.666em',
							} }
						/>
						<span>{ __( 'Active', 'jetpack-protect' ) }</span>
					</UIText>
					<AdminSectionHero.Heading showIcon>
						{ numThreats > 0
							? sprintf(
									/* translators: %1$s: the total number of threats/vulnerabilities, %2$s: the singular or plural form of "threat" or "vulnerability". */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats.toString(),
									hasPlan
										? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
										: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' )
							  )
							: sprintf(
									/* translators: %s: the pluralized type of threat/vulnerability. */
									__( 'No %s found', 'jetpack-protect' ),
									hasPlan
										? __( 'threats', 'jetpack-protect' )
										: _x( 'vulnerabilities', 'Plural of vulnerability', 'jetpack-protect' )
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
