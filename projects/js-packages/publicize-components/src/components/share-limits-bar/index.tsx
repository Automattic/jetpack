import { RecordMeterBar, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import styles from './styles.module.scss';

export type ShareLimitsBarProps = {
	currentCount: number;
	scheduledCount: number;
	activeConnectionsCount?: number;
	maxCount: number;
	text?: string;
	className?: string;
};

export const ShareLimitsBar: React.FC< ShareLimitsBarProps > = ( {
	currentCount,
	maxCount,
	scheduledCount,
	activeConnectionsCount,
	text,
	className,
} ) => {
	const items = useMemo( () => {
		return [
			{
				count: currentCount,
				backgroundColor: 'var(--jp-gray-90)',
				label: __( 'Shares used', 'jetpack' ),
			},
			activeConnectionsCount !== undefined && {
				count: activeConnectionsCount,
				backgroundColor: 'var(--jp-gray-40)',
				label: __( 'Active connections', 'jetpack' ),
			},
			{
				count: scheduledCount,
				backgroundColor: 'var(--jp-gray-20)',
				label: __( 'Shares scheduled', 'jetpack' ),
			},
		].filter( Boolean );
	}, [ currentCount, scheduledCount, activeConnectionsCount ] );
	return (
		<div className={ className }>
			{ text ? <Text className={ styles.text }>{ text }</Text> : null }
			<RecordMeterBar
				totalCount={ maxCount }
				items={ items }
				showLegendLabelBeforeCount
				className={ styles[ 'bar-wrapper' ] }
			/>
		</div>
	);
};
