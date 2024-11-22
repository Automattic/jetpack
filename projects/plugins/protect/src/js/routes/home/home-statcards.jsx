import { useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import Alert from '../../components/alert-icon';
import ProtectCheck from '../../components/protect-check-icon';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const HomeStatCards = () => {
	const { hasPlan } = usePlan();

	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();

	let lastCheckedLocalTimestamp = null;
	if ( lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();
	}

	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();

	const { allTime: allTimeBlockCount } = stats ? stats.blockedRequests : { allTime: 0 };

	const { blockedLogins: blockedLoginsCount } = stats;

	const defaultArgs = useMemo(
		() => ( {
			variant: isSmall ? 'horizontal' : 'square',
		} ),
		[ isSmall ]
	);

	const scanArgs = useMemo(
		() => ( {
			...defaultArgs,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					<ProtectCheck
						width={ '16' }
						height={ '19.14' }
						color={ numThreats ? '#F0B849' : '#069E08' }
					/>
				</span>
			),
			label: (
				<span className={ styles[ 'stat-card-label' ] }>
					{ __( 'Threats found', 'jetpack-protect' ) }
				</span>
			),
			value: numThreats,
		} ),
		[ defaultArgs, numThreats ]
	);

	const wafArgs = useMemo(
		() => ( {
			...defaultArgs,
			className: isWafModuleEnabled ? styles.active : styles.disabled,
			icon: (
				<span className={ styles[ 'stat-card-icon' ] }>
					{ isWafModuleEnabled ? (
						<ProtectCheck width={ '16' } height={ '19.14' } />
					) : (
						<Alert width={ '16' } height={ '19.14' } color={ '#A7AAAD' } />
					) }
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
					{ isBruteForceModuleEnabled ? (
						<ProtectCheck width={ '16' } height={ '19.14' } />
					) : (
						<Alert width={ '16' } height={ '19.14' } color={ '#A7AAAD' } />
					) }
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

	const lastCheckedMessage = useMemo( () => {
		const getEntity = () => {
			if ( numThreats === 1 ) {
				return hasPlan
					? __( 'threat', 'jetpack-protect' )
					: __( 'vulnerability', 'jetpack-protect' );
			}
			return hasPlan
				? __( 'threats', 'jetpack-protect' )
				: __( 'vulnerabilities', 'jetpack-protect' );
		};

		if ( numThreats > 0 ) {
			return sprintf(
				// translators: %1$s: date and time of the last scan, %2$d: number of threats/vulnerabilities, %3$s: "threat(s)" or "vulnerabilities"
				__( 'Last checked on %1$s: We found %2$d %3$s.', 'jetpack-protect' ),
				dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp ),
				numThreats,
				getEntity()
			);
		}

		return sprintf(
			// translators: %s: date and time of the last scan
			__( 'Last checked on %s: Your site is secure.', 'jetpack-protect' ),
			dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp )
		);
	}, [ numThreats, lastCheckedLocalTimestamp, hasPlan ] );

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
							? __( 'Untrusted traffic requests blocked all-time.', 'jetpack-protect' )
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
						? __( 'Login attempts blocked all-time.', 'jetpack-protect' )
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
