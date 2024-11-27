import { Text, useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import Alert from '../../components/alert-icon';
import ProtectCheck from '../../components/protect-check-icon';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const HomeStatCards = () => {
	const defaultHeight = '19.14';
	const defaultWidth = '16';

	const { hasPlan } = usePlan();
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
		error: scanError,
	} = useProtectData();

	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();

	const { allTime: allTimeBlockCount } = stats ? stats.blockedRequests : { allTime: 0 };
	const { blockedLogins: blockedLoginsCount } = stats;

	let lastCheckedLocalTimestamp = null;
	if ( lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();
	}

	const lastCheckedMessage = useMemo( () => {
		if ( scanError ) {
			return __(
				'Please check your connection or try scanning again in a few minutes.',
				'jetpack-protect'
			);
		}

		const entityLabel = hasPlan
			? _n( 'threat', 'threats', numThreats, 'jetpack-protect' )
			: _n( 'vulnerability', 'vulnerabilities', numThreats, 'jetpack-protect' );

		if ( numThreats > 0 ) {
			return sprintf(
				// translators: %1$s: date/time, %2$d: number, %3$s: entity label
				__( 'Last checked on %1$s: We found %2$d %3$s.', 'jetpack-protect' ),
				dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp ),
				numThreats,
				entityLabel
			);
		}
		return sprintf(
			// translators: %s: date/time
			__( 'Last checked on %s: Your site is secure.', 'jetpack-protect' ),
			dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp )
		);
	}, [ scanError, numThreats, lastCheckedLocalTimestamp, hasPlan ] );

	const renderIcon = isFeatureEnabled => {
		if ( isFeatureEnabled ) {
			return <ProtectCheck width={ defaultWidth } height={ defaultHeight } />;
		}
		return <Alert width={ defaultWidth } height={ defaultHeight } color="#A7AAAD" />;
	};

	const defaultArgs = useMemo(
		() => ( {
			variant: isSmall ? 'horizontal' : 'square',
		} ),
		[ isSmall ]
	);

	const scanArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: scanError ? styles.error : styles.active,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					{ scanError ? (
						<Alert width={ defaultWidth } height={ defaultHeight } />
					) : (
						<ProtectCheck
							width={ defaultWidth }
							height={ defaultHeight }
							color={ numThreats ? '#F0B849' : '#069E08' }
						/>
					) }
					<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
						{ __( 'Scan', 'jetpack-protect' ) }
					</Text>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ scanError
						? __( 'Unable to scan', 'jetpack-protect' )
						: sprintf(
								// translators: %s: "Threats" or "Vulnerabilities"
								__( '%s found', 'jetpack-protect' ),
								hasPlan
									? __( 'Threats', 'jetpack-protect' )
									: __( 'Vulnerabilities', 'jetpack-protect' )
						  ) }
				</span>
			),
			value: numThreats,
			errorMessage: scanError,
		} ),
		[ defaultArgs, scanError, hasPlan, numThreats ]
	);

	const wafArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: isWafModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					{ renderIcon( isWafModuleEnabled ) }{ ' ' }
					<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
						{ __( 'Firewall', 'jetpack-protect' ) }
					</Text>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked requests', 'jetpack-protect' ) }
				</span>
			),
			value: allTimeBlockCount,
		} ),
		[ defaultArgs, isWafModuleEnabled, allTimeBlockCount ]
	);

	const bruteForceArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: isBruteForceModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					{ renderIcon( isBruteForceModuleEnabled ) }
					<Text className={ styles[ 'stat-card-icon-label' ] } variant="body-extra-small">
						{ __( 'Brute force', 'jetpack-protect' ) }
					</Text>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Blocked logins', 'jetpack-protect' ) }
				</span>
			),
			value: blockedLoginsCount,
		} ),
		[ defaultArgs, isBruteForceModuleEnabled, blockedLoginsCount ]
	);

	return (
		<div className={ styles[ 'stat-cards-wrapper' ] }>
			<Tooltip className={ styles[ 'stat-card-tooltip' ] } text={ lastCheckedMessage }>
				<div className={ styles[ 'stat-card-wrapper' ] }>
					<StatCard { ...scanArgs } />
				</div>
			</Tooltip>
			{ wafSupported && (
				<Tooltip
					className={ styles[ 'stat-card-tooltip' ] }
					text={
						isWafModuleEnabled
							? __( 'Untrusted traffic requests blocked all time.', 'jetpack-protect' )
							: __( "Firewall is off. Untrusted traffic can't be blocked", 'jetpack-protect' )
					}
				>
					<div className={ styles[ 'stat-card-wrapper' ] }>
						<StatCard { ...wafArgs } />
					</div>
				</Tooltip>
			) }
			<Tooltip
				className={ styles[ 'stat-card-tooltip' ] }
				text={
					isBruteForceModuleEnabled
						? __( 'Total login attempts blocked all time.', 'jetpack-protect' )
						: __(
								"Brute force protect is off. Log in attempts can't be blocked.",
								'jetpack-protect'
						  )
				}
			>
				<div className={ styles[ 'stat-card-wrapper' ] }>
					<StatCard { ...bruteForceArgs } />
				</div>
			</Tooltip>
		</div>
	);
};

export default HomeStatCards;
