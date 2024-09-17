import { Text, useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, shield, chartBar } from '@wordpress/icons';
import styles from './styles.module.scss';

const FirewallStatCards = ( { status, hasPlan, oneDayStats, thirtyDayStats } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const defaultArgs = {
		className: status !== 'on' ? styles.disabled : styles.active,
		variant: isSmall ? 'horizontal' : 'square',
	};

	const getIcon = icon => (
		<span className={ styles[ 'stat-card-icon' ] }>
			<Icon icon={ icon } />
			{ ! isSmall && ! hasPlan && (
				<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
			) }
		</span>
	);

	const getLabel = ( period, units ) =>
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
		);

	const oneDayArgs = {
		...defaultArgs,
		icon: getIcon( shield ),
		label: getLabel( 24, 'hours' ),
		value: status !== 'on' ? 0 : oneDayStats,
	};

	const thirtyDayArgs = {
		...defaultArgs,
		icon: getIcon( chartBar ),
		label: getLabel( 30, 'days' ),
		value: status !== 'on' ? 0 : thirtyDayStats,
	};

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...oneDayArgs } />
			<StatCard { ...thirtyDayArgs } />
		</div>
	);
};

export default FirewallStatCards;
