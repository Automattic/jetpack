import { Text, useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, shield, chartBar } from '@wordpress/icons';
import { useCallback, useMemo } from 'react';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const FirewallStatCards = () => {
	const { hasPlan } = usePlan();
	const {
		config: { bruteForceProtection: isBruteForceModuleEnabled },
		isEnabled: isWafModuleEnabled,
		wafSupported,
		stats,
	} = useWafData();
	const isSupportedWafFeatureEnabled = wafSupported
		? isWafModuleEnabled
		: isBruteForceModuleEnabled;
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const { currentDay: currentDayBlockCount, thirtyDays: thirtyDayBlockCounts } = stats
		? stats.blockedRequests
		: { currentDay: 0, thirtyDays: 0 };

	const defaultArgs = useMemo(
		() => ( {
			className: ! isSupportedWafFeatureEnabled || ! hasPlan ? styles.disabled : styles.active,
			variant: isSmall ? 'horizontal' : 'square',
		} ),
		[ isSupportedWafFeatureEnabled, isSmall, hasPlan ]
	);

	const getIcon = useCallback(
		icon => (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ icon } />
				{ ! isSmall && ! hasPlan && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</span>
		),
		[ isSmall, hasPlan ]
	);

	const getLabel = useCallback(
		( period, units ) =>
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
			icon: getIcon( shield ),
			label: getLabel( 24, 'hours' ),
			value: ! isSupportedWafFeatureEnabled || ! hasPlan ? 0 : currentDayBlockCount,
		} ),
		[ defaultArgs, getIcon, getLabel, isSupportedWafFeatureEnabled, hasPlan, currentDayBlockCount ]
	);

	const thirtyDaysArgs = useMemo(
		() => ( {
			...defaultArgs,
			icon: getIcon( chartBar ),
			label: getLabel( 30, 'days' ),
			value: ! isSupportedWafFeatureEnabled || ! hasPlan ? 0 : thirtyDayBlockCounts,
		} ),
		[ defaultArgs, getIcon, getLabel, isSupportedWafFeatureEnabled, hasPlan, thirtyDayBlockCounts ]
	);

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...currentDayArgs } />
			<StatCard { ...thirtyDaysArgs } />
		</div>
	);
};

export default FirewallStatCards;
