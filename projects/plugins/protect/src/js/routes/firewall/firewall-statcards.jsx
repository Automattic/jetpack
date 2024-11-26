import { useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, shield, chartBar } from '@wordpress/icons';
import { useCallback, useMemo } from 'react';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const FirewallStatCards = () => {
	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const isSupportedWafFeatureEnabled = wafSupported
		? isWafModuleEnabled
		: isBruteForceModuleEnabled;
	const { currentDay: currentDayBlockCount, thirtyDays: thirtyDayBlockCounts } = stats
		? stats.blockedRequests
		: { currentDay: 0, thirtyDays: 0 };

	const defaultArgs = useMemo(
		() => ( {
			className: ! isSupportedWafFeatureEnabled ? styles.disabled : styles.active,
			variant: isSmall ? 'horizontal' : 'square',
		} ),
		[ isSupportedWafFeatureEnabled, isSmall ]
	);

	const StatCardIcon = useCallback(
		( { icon } ) => (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ icon } />
			</span>
		),
		[]
	);

	const StatCardLabel = useCallback(
		( { period, units } ) =>
			isSmall ? (
				<span>
					{ sprintf(
						/* translators: Translates to Blocked requests last %1$d: Number of units. %2$s: Unit of time (hours, days, etc) */
						__( 'Blocked requests last %1$d %2$s', 'jetpack-protect' ),
						period,
						units
					) }
				</span>
			) : (
				<span className={ styles[ 'stat-card-label' ] }>
					<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
					<br />
					<span>
						{ sprintf(
							/* translators: Translates to Last %1$d: Number of units. %2$s: Unit of time (hours, days, etc) */
							__( 'Last %1$d %2$s', 'jetpack-protect' ),
							period,
							units
						) }
					</span>
				</span>
			),
		[ isSmall ]
	);

	const currentDayArgs = useMemo(
		() => ( {
			...defaultArgs,
			icon: <StatCardIcon icon={ shield } />,
			label: <StatCardLabel period={ 24 } units="hours" />,
			value: ! isSupportedWafFeatureEnabled ? 0 : currentDayBlockCount,
		} ),
		[ defaultArgs, StatCardIcon, StatCardLabel, isSupportedWafFeatureEnabled, currentDayBlockCount ]
	);

	const thirtyDaysArgs = useMemo(
		() => ( {
			...defaultArgs,
			icon: <StatCardIcon icon={ chartBar } />,
			label: <StatCardLabel period={ 30 } units="days" />,
			value: ! isSupportedWafFeatureEnabled ? 0 : thirtyDayBlockCounts,
		} ),
		[ defaultArgs, StatCardIcon, StatCardLabel, isSupportedWafFeatureEnabled, thirtyDayBlockCounts ]
	);

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...currentDayArgs } />
			<StatCard { ...thirtyDaysArgs } />
		</div>
	);
};

export default FirewallStatCards;
