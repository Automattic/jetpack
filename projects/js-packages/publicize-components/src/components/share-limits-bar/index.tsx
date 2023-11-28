import { RecordMeterBar, Text } from '@automattic/jetpack-components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

export type ShareLimitsBarProps = {
	currentCount: number;
	scheduledCount: number;
	enabledConnectionsCount?: number;
	maxCount: number;
	text?: string;
	className?: string;
};

export const ShareLimitsBar = ( {
	currentCount,
	maxCount,
	scheduledCount,
	enabledConnectionsCount,
	text,
	className,
}: ShareLimitsBarProps ) => {
	const items = useMemo( () => {
		return [
			{
				count: currentCount,
				backgroundColor: 'var(--jp-gray-90)',
				label: __( 'Shares used', 'jetpack' ),
			},
			enabledConnectionsCount !== undefined && {
				count: enabledConnectionsCount,
				backgroundColor: 'var(--jp-gray-40)',
				label: __( 'Enabled connections', 'jetpack' ),
			},
			{
				count: scheduledCount,
				backgroundColor: 'var(--jp-gray-20)',
				label: __( 'Shares scheduled', 'jetpack' ),
			},
		].filter( Boolean );
	}, [ currentCount, scheduledCount, enabledConnectionsCount ] );
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
