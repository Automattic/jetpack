import { Text, useBreakpointMatch, StatCard, ShieldIcon } from '@automattic/jetpack-components';
import { Spinner, Tooltip } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const IconWithLabel = ( { label, isSmall, icon } ) => (
	<span className={ styles[ 'stat-card-icon' ] }>
		{ icon }
		{ ! isSmall && (
			<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
				{ label }
			</Text>
		) }
	</span>
);

const HomeStatCard = ( { text, args } ) => (
	<Tooltip className={ styles[ 'stat-card-tooltip' ] } text={ text }>
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...args } />
		</div>
	</Tooltip>
);

const HomeStatCards = () => {
	const ICON_HEIGHT = 20;

	const { hasPlan } = usePlan();
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const { data: status } = useScanStatusQuery();
	const scanning = isScanInProgress( status );
	const numThreats = status.threats.length;
	const scanError = status.error;

	let lastCheckedLocalTimestamp = null;
	if ( status.lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = dateI18n(
			'F jS g:i A',
			new Date( status.lastChecked + ' UTC' ).getTime(),
			false
		);
	}

	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();

	const {
		blockedRequests: { allTime: allTimeBlockedRequestsCount = 0 } = {},
		blockedLogins: allTimeBlockedLoginsCount = 0,
	} = stats || {};

	const variant = useMemo( () => ( isSmall ? 'horizontal' : 'square' ), [ isSmall ] );

	const lastCheckedMessage = useMemo( () => {
		if ( scanning ) {
			return __( 'Your results will be ready soon.', 'jetpack-protect' );
		}

		if ( scanError ) {
			return __(
				'Please check your connection or try scanning again in a few minutes.',
				'jetpack-protect'
			);
		}

		const entityLabel = hasPlan
			? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
			: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' );

		if ( lastCheckedLocalTimestamp ) {
			if ( numThreats > 0 ) {
				return sprintf(
					// translators: %1$s: date/time, %2$d: number, %3$s: entity label
					__( 'Last checked on %1$s: We found %2$d %3$s.', 'jetpack-protect' ),
					lastCheckedLocalTimestamp,
					numThreats,
					entityLabel
				);
			}
			return sprintf(
				// translators: %s: date/time
				__( 'Last checked on %s: Your site is secure.', 'jetpack-protect' ),
				lastCheckedLocalTimestamp
			);
		}

		return sprintf(
			// translators: %1$s: date/time, %2$d: number, %3$s: entity label
			__( 'Last scan we found %2$d %3$s.', 'jetpack-protect' ),
			lastCheckedLocalTimestamp,
			numThreats,
			entityLabel
		);
	}, [ scanError, scanning, numThreats, lastCheckedLocalTimestamp, hasPlan ] );

	const scanArgs = useMemo( () => {
		let scanIcon;
		if ( scanning ) {
			scanIcon = <Spinner />;
		} else if ( scanError ) {
			scanIcon = <ShieldIcon variant="error" height={ ICON_HEIGHT } />;
		} else {
			scanIcon = (
				<ShieldIcon
					variant={ numThreats ? 'warning' : 'success' }
					height={ ICON_HEIGHT }
					color={ numThreats ? '#F0B849' : '#069E08' }
				/>
			);
		}

		let scanLabel;
		if ( scanning ) {
			scanLabel = __( 'One moment, please…', 'jetpack-protect' );
		} else if ( scanError ) {
			scanLabel = __( 'An error occurred', 'jetpack-protect' );
		} else {
			const label = hasPlan
				? __( 'Threats', 'jetpack-protect' )
				: __( 'Vulnerabilities', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 );
			scanLabel = sprintf(
				// translators: %s: "Threats" or "Vulnerabilities"
				__( '%s identified', 'jetpack-protect' ),
				label
			);
		}

		return {
			variant,
			icon: (
				<IconWithLabel
					icon={ scanIcon }
					label={
						scanning
							? __( 'Scanning', 'jetpack-protect' )
							: __( 'Scan', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 )
					}
					isSmall={ isSmall }
				/>
			),
			label: <span className={ styles[ 'stat-card-label' ] }>{ scanLabel }</span>,
			value: numThreats,
			hideValue: !! ( scanError || scanning ),
		};
	}, [ variant, scanning, ICON_HEIGHT, scanError, numThreats, hasPlan, isSmall ] );

	const wafArgs = useMemo(
		() => ( {
			variant: variant,
			className: isWafModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					<ShieldIcon
						variant={ ! isWafModuleEnabled ? 'info' : 'success' }
						height={ ICON_HEIGHT }
					/>
					{ ! isSmall && (
						<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
							{ __( 'Firewall', 'jetpack-protect' ) }
						</Text>
					) }
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked requests', 'jetpack-protect' ) }
				</span>
			),
			value: allTimeBlockedRequestsCount,
			hideValue: ! isWafModuleEnabled,
		} ),
		[ variant, isWafModuleEnabled, ICON_HEIGHT, isSmall, allTimeBlockedRequestsCount ]
	);

	const bruteForceArgs = useMemo(
		() => ( {
			variant: variant,
			className: isBruteForceModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					<ShieldIcon
						variant={ ! isBruteForceModuleEnabled ? 'info' : 'success' }
						height={ ICON_HEIGHT }
					/>
					{ ! isSmall && (
						<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
							{ __( 'Brute force', 'jetpack-protect' ) }
						</Text>
					) }
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked login attempts', 'jetpack-protect' ) }
				</span>
			),
			value: allTimeBlockedLoginsCount,
			hideValue: ! isBruteForceModuleEnabled,
		} ),
		[ variant, isBruteForceModuleEnabled, ICON_HEIGHT, isSmall, allTimeBlockedLoginsCount ]
	);

	return (
		<div className={ styles[ 'stat-cards-wrapper' ] }>
			<HomeStatCard text={ lastCheckedMessage } args={ scanArgs } />
			{ wafSupported && (
				<HomeStatCard
					text={
						isWafModuleEnabled
							? __( 'Untrusted traffic requests blocked all time.', 'jetpack-protect' )
							: __(
									"Firewall is off. Untrusted traffic can't be blocked",
									'jetpack-protect',
									/* dummy arg to avoid bad minification */ 0
							  )
					}
					args={ wafArgs }
				/>
			) }
			<HomeStatCard
				text={
					isBruteForceModuleEnabled
						? __( 'Total login attempts blocked all time.', 'jetpack-protect' )
						: __(
								"Brute force protection is off. Log in attempts can't be blocked.",
								'jetpack-protect',
								/* dummy arg to avoid bad minification */ 0
						  )
				}
				args={ bruteForceArgs }
			/>
		</div>
	);
};

export default HomeStatCards;
