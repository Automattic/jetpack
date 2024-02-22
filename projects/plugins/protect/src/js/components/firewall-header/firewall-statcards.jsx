import { Text, useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, shield, chartBar } from '@wordpress/icons';
import React from 'react';
import styles from './styles.module.scss';

const FirewallStatCards = ( {
	status,
	hasRequiredPlan,
	oneDayStats,
	thirtyDayStats,
	jetpackWafShareData,
} ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const statCardIsDisabled = status !== 'on' || ! hasRequiredPlan || ! jetpackWafShareData;

	const oneDayArgs = {
		className: statCardIsDisabled ? styles.disabled : styles.active,
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ shield } />
				{ ! isSmall && ! hasRequiredPlan && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</span>
		),
		label: isSmall ? (
			<span>{ __( 'Blocked requests last 24 hours', 'jetpack-protect' ) }</span>
		) : (
			<span className={ styles[ 'stat-card-label' ] }>
				<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
				<br />
				<span>{ __( 'Last 24 hours', 'jetpack-protect' ) }</span>
			</span>
		),
		value: hasRequiredPlan ? oneDayStats : 0,
		variant: isSmall ? 'horizontal' : 'square',
	};

	const thirtyDayArgs = {
		className: statCardIsDisabled ? styles.disabled : styles.active,
		icon: (
			<span className={ styles[ 'stat-card-icon' ] }>
				<Icon icon={ chartBar } />
				{ ! isSmall && ! hasRequiredPlan && (
					<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
				) }
			</span>
		),
		label: isSmall ? (
			<span>{ __( 'Blocked requests last 30 days', 'jetpack-protect' ) }</span>
		) : (
			<span className={ styles[ 'stat-card-label' ] }>
				<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
				<br />
				<span>{ __( 'Last 30 days', 'jetpack-protect' ) }</span>
			</span>
		),
		value: hasRequiredPlan ? thirtyDayStats : 0,
		variant: isSmall ? 'horizontal' : 'square',
	};

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...oneDayArgs } />
			<StatCard { ...thirtyDayArgs } />
		</div>
	);
};

export default FirewallStatCards;
