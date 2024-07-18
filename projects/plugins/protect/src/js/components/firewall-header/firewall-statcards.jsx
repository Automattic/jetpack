import { Text, useBreakpointMatch, StatCard } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
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

	const defaultArgs = {
		className: statCardIsDisabled ? styles.disabled : styles.active,
		variant: isSmall ? 'horizontal' : 'square',
	};

	const getIcon = icon => (
		<span className={ styles[ 'stat-card-icon' ] }>
			<Icon icon={ icon } />
			{ ! isSmall && ! hasRequiredPlan && (
				<Text variant={ 'label' }>{ __( 'Paid feature', 'jetpack-protect' ) }</Text>
			) }
		</span>
	);

	const getLabel = period =>
		isSmall ? (
			<span>
				{ sprintf(
					// translators: %d is the number of hours
					__( 'Blocked requests last %d hours', 'jetpack-protect' ),
					period
				) }
			</span>
		) : (
			<span className={ styles[ 'stat-card-label' ] }>
				<span>{ __( 'Blocked requests', 'jetpack-protect' ) }</span>
				<br />
				<span>
					{ sprintf(
						// translators: %d is the number of hours
						__( 'Last %d hours', 'jetpack-protect' ),
						period
					) }
				</span>
			</span>
		);

	const oneDayArgs = {
		...defaultArgs,
		icon: getIcon( shield ),
		label: getLabel( 24 ),
		value: statCardIsDisabled ? 0 : oneDayStats,
	};

	const thirtyDayArgs = {
		...defaultArgs,
		icon: getIcon( chartBar ),
		label: getLabel( 30 ),
		value: statCardIsDisabled ? 0 : thirtyDayStats,
	};

	return (
		<div className={ styles[ 'stat-card-wrapper' ] }>
			<StatCard { ...oneDayArgs } />
			<StatCard { ...thirtyDayArgs } />
		</div>
	);
};

export default FirewallStatCards;
